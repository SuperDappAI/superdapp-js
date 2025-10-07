#!/usr/bin/env bash
set -euo pipefail

DEFAULT_DOMAIN="giana-undefinable-unremittingly.ngrok-free.dev"
DOMAIN="${NGROK_DOMAIN:-$DEFAULT_DOMAIN}"

printf 'Starting ngrok tunnel using domain %s\n' "$DOMAIN"

exec npx -y ngrok@5.0.0-beta.2 http ${PORT:-3002} --domain="$DOMAIN"
