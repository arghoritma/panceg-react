# Bare-Metal Deployment

This directory deploys the application on one Linux host without Docker:

```text
Caddy (TLS) -> Bun on 127.0.0.1:4000 -> SQLite and uploads in /srv/panceg/data
```

This topology is intentionally single-process. SQLite, local uploads, the rate
limiter, and metrics registry are local to one host. Use PostgreSQL, object
storage, and a shared rate-limit store before scaling horizontally.

## Prerequisites

- Debian/Ubuntu-like Linux host.
- DNS A/AAAA record for the domain pointing at the host.
- Caddy installed and enabled.
- Bun installed globally at `/usr/local/bin/bun`.
- A checkout of this repository placed at `/srv/panceg/app` and owned by `panceg`.

## Initial Setup

1. Copy the repository to `/srv/panceg/app`.
2. From the repository root, as root, run `sh deploy/bootstrap.sh`.
3. Edit `/etc/panceg/panceg.env`:
   - Set `APP_URL` to the public HTTPS domain.
   - Set a production mail driver and credentials.
   - Set OAuth credentials if Google login is enabled.
   - Set `METRICS_TOKEN` when metrics is accessed outside loopback.
4. Replace `app.example.com` in `deploy/Caddyfile` with the actual domain.
   Copy it to a site snippet such as `/etc/caddy/sites/panceg.caddy`, then add
   this import to the host's existing `/etc/caddy/Caddyfile` without replacing
   other sites:

```caddy
import /etc/caddy/sites/*.caddy
```

5. Validate and reload Caddy:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

6. Enable the service as root:

```bash
sudo systemctl enable panceg
```

7. Allow deploys without granting broad sudo access. Create
   `/etc/sudoers.d/panceg` with exactly:

```sudoers
panceg ALL=(root) NOPASSWD: /bin/systemctl restart panceg
```

8. As the `panceg` user, from `/srv/panceg/app`, run:

```bash
sh deploy/release.sh
```

## Updating

Put the desired revision in `/srv/panceg/app`, then run as `panceg`:

```bash
cd /srv/panceg/app
git pull --ff-only
sh deploy/release.sh
```

The release script installs locked dependencies, type-checks, builds assets,
applies pending migrations via the dedicated CLI, restarts only after a
successful build and migration, then verifies `/health` through the loopback
listener. The production environment uses `MIGRATIONS_MODE=cli`, so app startup
does not mutate schema.

Before a release containing schema changes, back up the SQLite database. Review
pending work with `bun run db:status`; if rollback is required, it can only
reverse the latest migration and only when that migration has a `-- down`
section. Do not edit an applied migration to repair production schema history.

## Operations

```bash
sudo systemctl status panceg
sudo journalctl -u panceg -f
sudo systemctl restart panceg
```

Back up both `/srv/panceg/data/app.sqlite` and `/srv/panceg/data/uploads/` before
schema changes or host maintenance. Never run two application processes against
the same SQLite database.
