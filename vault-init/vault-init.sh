#!/bin/sh
set -e # Exit immediately if a command exits with a non-zero status.
# set -x # Uncomment for deep debugging

VAULT_ADDR="http://vault:8200"
VAULT_FILE_DIR="/vault/file" # This directory MUST be writable
UNSEAL_FILE="$VAULT_FILE_DIR/unseal.json"
TOKEN_FILE="$VAULT_FILE_DIR/app_token"
POLICY_HCL_FILE="$VAULT_FILE_DIR/app-policy.hcl" # Renamed for clarity
POLICY_RESPONSE_FILE="$VAULT_FILE_DIR/policy_upload_response.json"

# 1. Ensure VAULT_FILE_DIR exists and is writable
mkdir -p "$VAULT_FILE_DIR"
if ! touch "$VAULT_FILE_DIR/.write_test" 2>/dev/null; then
    echo "FATAL: Directory $VAULT_FILE_DIR is not writable or does not exist." >&2
    ls -ld "$VAULT_FILE_DIR" >&2 # Show permissions of the directory itself
    exit 1
fi
rm "$VAULT_FILE_DIR/.write_test"

# 2. Wait for Vault
echo "Waiting for Vault to be available at $VAULT_ADDR..."
until curl -s -o /dev/null -w "%{http_code}" "$VAULT_ADDR/v1/sys/health" | grep -Eq "200|429|472|473|501|503"; do
  echo "Vault not ready yet (HTTP status not in expected set)..."
  sleep 2
done
echo "Vault is available."

# 3. Handle Initialization and Unsealing
HEALTH_STATUS=$(curl -s "$VAULT_ADDR/v1/sys/health")
INITIALIZED=$(echo "$HEALTH_STATUS" | jq -r '.initialized')
SEALED=$(echo "$HEALTH_STATUS" | jq -r '.sealed') # Check sealed status early

if [ "$INITIALIZED" != "true" ]; then
  echo "Vault not initialized. Initializing..."
  INIT_PAYLOAD='{"secret_shares": 1, "secret_threshold": 1}'
  INIT_RESPONSE=$(curl -s --request PUT --data "$INIT_PAYLOAD" "$VAULT_ADDR/v1/sys/init")
  if ! echo "$INIT_RESPONSE" | jq -e .keys_base64[0] >/dev/null 2>&1; then
    echo "FATAL: Failed to initialize Vault. Response: $INIT_RESPONSE" >&2; exit 1
  fi
  echo "$INIT_RESPONSE" > "$UNSEAL_FILE"; sync
  if [ ! -s "$UNSEAL_FILE" ]; then echo "FATAL: Failed to write $UNSEAL_FILE." >&2; exit 1; fi
  echo "Vault initialized. Data saved to $UNSEAL_FILE."
  UNSEAL_KEY=$(echo "$INIT_RESPONSE" | jq -r '.keys_base64[0]')
  ROOT_TOKEN=$(echo "$INIT_RESPONSE" | jq -r '.root_token')
  SEALED="true" # After init, Vault is sealed
else
  echo "Vault already initialized."
  if [ ! -s "$UNSEAL_FILE" ]; then echo "FATAL: $UNSEAL_FILE missing/empty for initialized Vault." >&2; exit 1; fi
  INIT_DATA=$(cat "$UNSEAL_FILE")
  UNSEAL_KEY=$(echo "$INIT_DATA" | jq -r '.keys_base64[0]')
  ROOT_TOKEN=$(echo "$INIT_DATA" | jq -r '.root_token')
  # Re-fetch SEALED status if already initialized
  SEALED=$(curl -s "$VAULT_ADDR/v1/sys/health" | jq -r '.sealed')
fi

if [ "$UNSEAL_KEY" = "null" ] || [ -z "$UNSEAL_KEY" ] || [ "$ROOT_TOKEN" = "null" ] || [ -z "$ROOT_TOKEN" ]; then
    echo "FATAL: UNSEAL_KEY or ROOT_TOKEN is null/empty." >&2; exit 1
fi

if [ "$SEALED" = "true" ]; then
  echo "Vault is sealed. Unsealing..."
  UNSEAL_PAYLOAD="{\"key\": \"$UNSEAL_KEY\"}"
  UNSEAL_RESPONSE=$(curl -s --request PUT --data "$UNSEAL_PAYLOAD" "$VAULT_ADDR/v1/sys/unseal")
  if ! echo "$UNSEAL_RESPONSE" | jq -e '.sealed == false' >/dev/null 2>&1; then
    echo "FATAL: Failed to unseal Vault. Response: $UNSEAL_RESPONSE" >&2; exit 1
  fi
  echo "Vault unsealed successfully."
else
  echo "Vault is already unsealed."
fi

# 4. Ensure KVv2 engine at 'secret/'
echo "Ensuring KV-v2 engine at 'secret/'..."
SECRET_MOUNT_INFO_RAW=$(curl -s --header "X-Vault-Token: $ROOT_TOKEN" "$VAULT_ADDR/v1/sys/mounts")
SECRET_MOUNT_INFO=$(echo "$SECRET_MOUNT_INFO_RAW" | jq -r '.["secret/"] // null')
if [ "$SECRET_MOUNT_INFO" = "null" ]; then
  echo "Enabling KV-v2 engine at 'secret/'..."
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --header "X-Vault-Token: $ROOT_TOKEN" \
    --request POST --data '{"type":"kv", "options":{"version":"2"}}' \
    "$VAULT_ADDR/v1/sys/mounts/secret")
  if [ "$HTTP_CODE" != "204" ] && [ "$HTTP_CODE" != "200" ]; then
    echo "FATAL: Failed to enable KV-v2 at 'secret/'. HTTP: $HTTP_CODE" >&2; exit 1
  fi
  echo "KV-v2 enabled at 'secret/'."
else
  TYPE=$(echo "$SECRET_MOUNT_INFO" | jq -r '.type')
  VERSION=$(echo "$SECRET_MOUNT_INFO" | jq -r '.options.version // "1"')
  if [ "$TYPE" = "kv" ] && [ "$VERSION" = "2" ]; then
    echo "KV-v2 already configured at 'secret/'."
  else
    echo "FATAL: 'secret/' is not KV-v2. Type: $TYPE, Version: $VERSION" >&2; exit 1
  fi
fi

# 5. Create and Upload Policy
echo "Defining app-policy in $POLICY_HCL_FILE..."
cat <<EOF > "$POLICY_HCL_FILE"
path "secret/data/ssh/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
# Access for targets path
path "secret/data/ssh/targets/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
path "secret/metadata/ssh/targets/*" {
  capabilities = ["list", "delete"]
}
path "secret/metadata/ssh/targets" {
  capabilities = ["list"]
}
path "secret/data/ssh/downloads/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
path "secret/metadata/ssh/downloads/*" {
  capabilities = ["list", "delete"]
}
path "secret/metadata/ssh/downloads" {
  capabilities = ["list"]
}
# ... [rest of policy content unchanged] ...
EOF

echo "Uploading app-policy..."
POLICY_JSON=$(jq -n --arg policy "$(cat "$POLICY_HCL_FILE")" '{"policy": $policy}')
HTTP_CODE=$(curl -s -o "$POLICY_RESPONSE_FILE" -w "%{http_code}" \
    --header "X-Vault-Token: $ROOT_TOKEN" \
    --request POST \
    --data "$POLICY_JSON" \
    "$VAULT_ADDR/v1/sys/policies/acl/app-policy")

if [ "$HTTP_CODE" != "204" ]; then
    echo "FATAL: Policy upload failed. HTTP $HTTP_CODE" >&2
    jq .errors "$POLICY_RESPONSE_FILE" >&2
    exit 1
fi
echo "Policy 'app-policy' uploaded successfully."

# 6. Create App Token
echo "Creating app token..."
CREATE_TOKEN_PAYLOAD='{"policies":["app-policy", "default"],"ttl":"24h","renewable":true, "display_name":"app-token"}'
APP_TOKEN_RESPONSE=$(curl -s --header "X-Vault-Token: $ROOT_TOKEN" --request POST \
    --data "$CREATE_TOKEN_PAYLOAD" "$VAULT_ADDR/v1/auth/token/create")
APP_TOKEN=$(echo "$APP_TOKEN_RESPONSE" | jq -r '.auth.client_token')

if [ "$APP_TOKEN" = "null" ] || [ -z "$APP_TOKEN" ]; then
    echo "FATAL: Failed to create app token. Response: $APP_TOKEN_RESPONSE" >&2; exit 1
fi
echo "$APP_TOKEN" > "$TOKEN_FILE"; sync
if [ ! -s "$TOKEN_FILE" ]; then echo "FATAL: Failed to write $TOKEN_FILE." >&2; exit 1; fi
echo "App token created and saved to $TOKEN_FILE."

# 7. Verify Token (Optional, but good practice)
TOKEN_LOOKUP=$(curl -s --header "X-Vault-Token: $APP_TOKEN" "$VAULT_ADDR/v1/auth/token/lookup-self")
POLICIES_ON_TOKEN=$(echo "$TOKEN_LOOKUP" | jq -r '.data.policies | join(",")')
echo "App token policies: $POLICIES_ON_TOKEN"
if ! echo "$POLICIES_ON_TOKEN" | grep -q "app-policy"; then
    echo "WARNING: 'app-policy' not found on the created token!" >&2
fi

echo "Contents of $VAULT_FILE_DIR:"
ls -l "$VAULT_FILE_DIR"
echo "Vault initialization and setup process complete."
exit 0
