#!/usr/bin/env sh
# Run once as root on a Debian/Ubuntu host after Bun and Caddy are installed.
# It creates the service user, persistent directories, and installs templates.
set -eu

APP_USER="panceg"
APP_GROUP="panceg"
APP_ROOT="/srv/panceg"
APP_DIR="$APP_ROOT/app"
DATA_DIR="$APP_ROOT/data"
ENV_DIR="/etc/panceg"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script as root." >&2
  exit 1
fi

if ! command -v bun >/dev/null 2>&1; then
  echo "Bun must be installed at /usr/local/bin/bun before bootstrapping." >&2
  exit 1
fi

if [ ! -x /usr/local/bin/bun ]; then
  echo "Expected Bun at /usr/local/bin/bun to match deploy/panceg.service." >&2
  exit 1
fi

if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --system --create-home --home-dir "$APP_ROOT" \
    --shell /usr/sbin/nologin "$APP_USER"
fi

install -d -o "$APP_USER" -g "$APP_GROUP" -m 0750 "$APP_ROOT" "$DATA_DIR" "$DATA_DIR/uploads"
install -d -o root -g "$APP_GROUP" -m 0750 "$ENV_DIR"

# The checkout is deployed separately, then owned by the service account.
install -d -o "$APP_USER" -g "$APP_GROUP" -m 0755 "$APP_DIR"
chown -R "$APP_USER:$APP_GROUP" "$APP_DIR"

if [ ! -f "$ENV_DIR/panceg.env" ]; then
  install -o root -g "$APP_GROUP" -m 0640 deploy/.env.production.example "$ENV_DIR/panceg.env"
  echo "Created $ENV_DIR/panceg.env. Fill in APP_URL and secrets before starting the service."
fi

install -o root -g root -m 0644 deploy/panceg.service /etc/systemd/system/panceg.service

systemctl daemon-reload
echo "Bootstrap complete. Replace app.example.com in deploy/Caddyfile and import it into the host Caddyfile without overwriting existing sites. Then run deploy/release.sh."
