# Choose a base image that has sh, curl. Alpine is common.
FROM alpine:latest

# Install dependencies: curl for HTTP requests, jq for JSON processing
RUN apk add --no-cache curl jq coreutils

# Create a directory for Vault files (though docker-compose volume mapping will manage it)
RUN mkdir -p /vault/file /vault/config

# Copy the initialization script into the container
COPY init.sh /usr/local/bin/init.sh
RUN chmod +x /usr/local/bin/init.sh

# Optional: If you have a static policy file you want to include in the image
# COPY app_policy.hcl /vault/config/app_policy.hcl

# This declares that /vault/file is intended to be a mount point for a volume.
# Docker Compose will map the 'vault' named volume here.
VOLUME /vault/file

# Set the entrypoint or command to run the script
ENTRYPOINT ["/usr/local/bin/init.sh"]