---
type: concept
created: 2026-08-03
updated: 2026-10-12
---

# Versioned SQL migrations

Versioned SQL files define schema changes. They are applied in filename order
inside transactions and recorded in `schema_migrations`, so an applied
migration is never run twice.

## Definition

New migrations use one reversible `migrations/000N_name.sql` file:

```sql
-- 0008_add_posts

-- up
CREATE TABLE posts (...);

-- down
DROP TABLE posts;
```

`-- up` and `-- down` must be marker lines by themselves. The runner executes
only the `up` body when migrating and only the `down` body when rolling back.
It records a SHA-256 checksum of the complete file and stops if an applied file
is missing or changed.

Use `bun run db:make <lowercase_snake_case_name>` to create the next numbered
template. `createMigration()` is implemented in `src/server/migrations.ts`;
`scripts/create-migration.ts` is intentionally only a CLI wrapper.

`bun run db:migrate`, `bun run db:status`, and `bun run db:rollback` operate
through the dedicated CLI. Rollback is transactional, applies only to the
latest migration, and requires a non-empty `down` section. Legacy migrations
without section markers remain supported as up-only history.

After a successful CLI migrate or rollback, the CLI regenerates `erd.dbml` from
the resulting SQLite schema. It includes application tables, columns, explicit
indexes, and foreign-key references while excluding the runner's internal
`schema_migrations` table. `erd.dbml` is generated output and should be
committed with its schema migration; do not edit it manually.

Use `MIGRATIONS_MODE=startup` for local development, where pending migrations
run when the server starts. Use `MIGRATIONS_MODE=cli` for controlled releases,
running `bun run db:migrate` before restarting the application. Never edit an
applied migration; make a new migration to correct it.

## Links
