#!/bin/sh
set -e # Exit immediately if a command exits with a non-zero status.
# set -x # Uncomment for deep debugging to see every command executed

VAULT_ADDR="http://vault:8200"
# Ensure the /vault/file directory exists and is writable by this script
# This is crucial because this script will write unseal keys and tokens here.
# The 'vault' named volume is mounted here.
VAULT_FILE_DIR="/vault/file"
UNSEAL_FILE="$VAULT_FILE_DIR/unseal.json"
TOKEN_FILE="$VAULT_FILE_DIR/app_token"
POLICY_FILE_SRC="/vault/config/app_policy.hcl" # Assuming policy is static and part of config
                                             # If generated, put in VAULT_FILE_DIR

# Create the target directory for Vault files if it doesn't exist
# This is particularly important if the volume is freshly created
mkdir -p "$VAULT_FILE_DIR"
# To be safe, ensure script has permissions to write here (usually runs as root in init container)
touch "$VAULT_FILE_DIR/.can_write_test" && rm "$VAULT_FILE_DIR/.can_write_test"

echo "Waiting for Vault to be available at $VAULT_ADDR..."
# Enhanced wait loop: checks for various Vault states indicating it's up
# HTTP codes:
# 200: initialized, unsealed, and active
# 429: unsealed and standby
# 472: disaster recovery mode replication secondary and active (Vault Enterprise)
# 473: performance standby (Vault Enterprise)
# 501: not initialized
# 503: sealed
until curl -s -o /dev/null -w "%{http_code}" $VAULT_ADDR/v1/sys/health | grep -Eq "200|429|472|473|501|503"; do
  echo "Vault not ready yet at $VAULT_ADDR (waiting for HTTP 200, 429, 472, 473, 501, or 503)..."
  sleep 2
done
echo "Vault is available."

# Check current Vault health status
HEALTH_STATUS=$(curl -s $VAULT_ADDR/v1/sys/health)
INITIALIZED=$(echo "$HEALTH_STATUS" | jq -r '.initialized')

if [ "$INITIALIZED" != "true" ]; then
  echo "Vault not initialized. Initializing..."
  # Define payload for initialization
  INIT_PAYLOAD='{"secret_shares": 1, "secret_threshold": 1}'
  
  # Perform initialization
  INIT_RESPONSE=$(curl -s --request PUT --data "$INIT_PAYLOAD" $VAULT_ADDR/v1/sys/init)
  
  # Validate initialization response
  if ! echo "$INIT_RESPONSE" | jq -e .keys_base64[0] > /dev/null 2>&1; then
      echo "FATAL: Failed to initialize Vault or received invalid response." >&2
      echo "Vault Init Payload: $INIT_PAYLOAD" >&2
      echo "Vault Init Response: $INIT_RESPONSE" >&2
      exit 1
  fi

  # Persist the full initialization response (contains unseal keys and root token)
  echo "Saving initialization data to $UNSEAL_FILE..."
  echo "$INIT_RESPONSE" > "$UNSEAL_FILE"
  sync # Attempt to flush file system buffers to disk

  # Verify that the unseal file was written and is not empty
  if [ ! -s "$UNSEAL_FILE" ]; then
      echo "FATAL: Failed to write unseal keys to $UNSEAL_FILE or file is empty." >&2
      echo "Vault Init Response was: $INIT_RESPONSE" >&2
      exit 1
  fi
  echo "Vault initialized. Unseal keys and root token saved to $UNSEAL_FILE."
  
  UNSEAL_KEY=$(echo "$INIT_RESPONSE" | jq -r '.keys_base64[0]')
  ROOT_TOKEN=$(echo "$INIT_RESPONSE" | jq -r '.root_token')

  if [ "$UNSEAL_KEY" = "null" ] || [ -z "$UNSEAL_KEY" ]; then
      echo "FATAL: Extracted UNSEAL_KEY is null or empty from init response." >&2
      exit 1
  fi
  if [ "$ROOT_TOKEN" = "null" ] || [ -z "$ROOT_TOKEN" ]; then
      echo "FATAL: Extracted ROOT_TOKEN is null or empty from init response." >&2
      exit 1
  fi

else
  echo "Vault already initialized."
  # Check if the unseal file exists and is not empty
  if [ ! -f "$UNSEAL_FILE" ] || [ ! -s "$UNSEAL_FILE" ]; then
    echo "Error: Vault is initialized, but the unseal key file ($UNSEAL_FILE) is missing or empty." >&2
    echo "This file is critical for automated unsealing and token management on subsequent starts." >&2
    echo "" >&2
    echo "# ===================== VAULT MANUAL UNSEAL/RECOVERY INSTRUCTIONS =====================" >&2
    echo "If you have previously initialized Vault and saved your unseal keys and root token securely:" >&2
    echo "1. Create the file '$UNSEAL_FILE' manually in the 'vault' Docker volume." >&2
    echo "   The content should be the JSON output from the initial 'vault operator init' command, e.g.:" >&2
    echo "   {\"keys\":[\"...\"],\"keys_base64\":[\"<YOUR_UNSEAL_KEY_B64>\"],\"root_token\":\"<YOUR_ROOT_TOKEN>\"}" >&2
    echo "2. Alternatively, to just unseal (if you have the key):" >&2
    echo "   Run: curl --request PUT --data '{\"key\":\"<YOUR_UNSEAL_KEY_B64>\"}' $VAULT_ADDR/v1/sys/unseal" >&2
    echo "If you have lost the unseal keys and root token, you may need to reset Vault (ERASING ALL DATA) or restore from backup." >&2
    echo "# =====================================================================================" >&2
    exit 1
  fi
  
  echo "Reading unseal key and root token from $UNSEAL_FILE."
  INIT_DATA=$(cat "$UNSEAL_FILE")
  UNSEAL_KEY=$(echo "$INIT_DATA" | jq -r '.keys_base64[0]')
  ROOT_TOKEN=$(echo "$INIT_DATA" | jq -r '.root_token')

  # Validate keys extracted from file
  if [ "$UNSEAL_KEY" = "null" ] || [ -z "$UNSEAL_KEY" ]; then
    echo "Error: $UNSEAL_FILE is present, but UNSEAL_KEY is null or empty after parsing." >&2
    echo "File content:" >&2
    cat "$UNSEAL_FILE" >&2
    exit 1
  fi
  if [ "$ROOT_TOKEN" = "null" ] || [ -z "$ROOT_TOKEN" ]; then
    echo "Error: $UNSEAL_FILE is present, but ROOT_TOKEN is null or empty after parsing." >&2
    echo "File content:" >&2
    cat "$UNSEAL_FILE" >&2
    exit 1
  fi
fi

# At this point, UNSEAL_KEY and ROOT_TOKEN should be set.

# Re-fetch health status as it might have changed or to check sealed status
HEALTH_STATUS_AFTER_INIT_CHECK=$(curl -s $VAULT_ADDR/v1/sys/health)
SEALED=$(echo "$HEALTH_STATUS_AFTER_INIT_CHECK" | jq -r '.sealed')

if [ "$SEALED" = "true" ]; then
  echo "Vault is sealed. Unsealing..."
  UNSEAL_RESPONSE=$(curl -s --request PUT --data "{\"key\": \"$UNSEAL_KEY\"}" $VAULT_ADDR/v1/sys/unseal)
  
  # Check if unseal was successful by inspecting the response
  if ! echo "$UNSEAL_RESPONSE" | jq -e '.sealed == false' > /dev/null 2>&1; then
      echo "FATAL: Failed to unseal Vault." >&2
      echo "Unseal Key used (first 5 chars): $(echo $UNSEAL_KEY | cut -c 1-5)..." >&2
      echo "Unseal Response: $UNSEAL_RESPONSE" >&2
      # Check if key was wrong
      if echo "$UNSEAL_RESPONSE" | grep -q "invalid unseal key"; then
          echo "The unseal key in $UNSEAL_FILE seems to be incorrect." >&2
      fi
      exit 1
  fi
  echo "Vault unsealed successfully."
else
  echo "Vault is already unsealed."
fi

# Create or update the application policy
# For this example, policy is generated by the script and written to a temp location.
# If your policy is static, it's better to COPY it into the image and use that path.
# Your original script wrote POLICY_FILE to /vault/file/app_policy.hcl, which is fine.
TEMP_POLICY_HCL_FILE="$VAULT_FILE_DIR/app_policy_generated.hcl"
echo "Creating policy definition at $TEMP_POLICY_HCL_FILE..."
cat > "$TEMP_POLICY_HCL_FILE" <<EOF
path "secret/data/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
EOF
sync # Ensure policy file is written

echo "Uploading app-policy..."
POLICY_UPLOAD_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
     --header "X-Vault-Token: $ROOT_TOKEN" \
     --request PUT \
     --data @"$TEMP_POLICY_HCL_FILE" \
     $VAULT_ADDR/v1/sys/policies/acl/app-policy)

if [ "$POLICY_UPLOAD_HTTP_CODE" != "204" ]; then
    echo "WARNING: Failed to upload policy 'app-policy'. HTTP Status: $POLICY_UPLOAD_HTTP_CODE." >&2
    echo "Root token used (first 5 chars): $(echo $ROOT_TOKEN | cut -c 1-5)..." >&2
    # You might want to exit 1 here if policy is critical
    # exit 1
else
    echo "Policy 'app-policy' created/updated successfully."
fi
# rm -f "$TEMP_POLICY_HCL_FILE" # Optional: clean up policy file from shared volume

# Create or renew an application token
echo "Creating/Renewing app token with policy 'app-policy'..."
CREATE_TOKEN_PAYLOAD='{"policies":["app-policy"],"ttl":"24h","renewable":true}'
APP_TOKEN_RESPONSE=$(curl -s --header "X-Vault-Token: $ROOT_TOKEN" \
     --request POST \
     --data "$CREATE_TOKEN_PAYLOAD" \
     $VAULT_ADDR/v1/auth/token/create)

APP_TOKEN=$(echo "$APP_TOKEN_RESPONSE" | jq -r '.auth.client_token')

if [ "$APP_TOKEN" = "null" ] || [ -z "$APP_TOKEN" ]; then
    echo "FATAL: Failed to create/renew app token." >&2
    echo "Root token used (first 5 chars): $(echo $ROOT_TOKEN | cut -c 1-5)..." >&2
    echo "Create Token Payload: $CREATE_TOKEN_PAYLOAD" >&2
    echo "Create Token Response: $APP_TOKEN_RESPONSE" >&2
    exit 1
fi

echo "App token created/renewed successfully."
echo "$APP_TOKEN" > "$TOKEN_FILE"
sync # Ensure token file is written

if [ ! -s "$TOKEN_FILE" ]; then
    echo "FATAL: Failed to write app token to $TOKEN_FILE or file is empty." >&2
    exit 1
fi

echo "App token saved to $TOKEN_FILE."
echo "Vault initialization and setup process complete."
exit 0