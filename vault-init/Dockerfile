FROM alpine:latest

RUN apk add --no-cache curl jq coreutils # coreutils for 'sync' and 'ls' if busybox versions are insufficient

COPY vault-init.sh /usr/local/bin/vault-init.sh
RUN chmod +x /usr/local/bin/vault-init.sh

ENTRYPOINT ["/usr/local/bin/vault-init.sh"]