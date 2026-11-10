#!/usr/bin/env sh
# Run as the panceg user from /srv/panceg/app after a new revision is present.
# Build before restarting so a failed build leaves the running release intact.
set -eu

APP_DIR="/srv/panceg/app"
HEALTH_URL="http://127.0.0.1:4000/health"

if [ "$(id -un)" != "panceg" ]; then
  echo "Run this script as the panceg user." >&2
  exit 1
fi

if [ "$(pwd)" != "$APP_DIR" ]; then
  echo "Run from $APP_DIR." >&2
  exit 1
fi

bun install --frozen-lockfile
bun run typecheck
bun run build
bun run db:migrate

sudo systemctl restart panceg

attempt=1
while [ "$attempt" -le 10 ]; do
  if curl --fail --silent --show-error "$HEALTH_URL" >/dev/null; then
    echo "Deployment healthy."
    exit 0
  fi
  attempt=$((attempt + 1))
  sleep 1
done

echo "Deployment failed its health check. Inspect: journalctl -u panceg -n 100" >&2
exit 1
