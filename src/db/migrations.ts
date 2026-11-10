/** Versioned SQL migrations with transactional up/down execution. */
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { Database } from "bun:sqlite";

const MIGRATIONS_DIR = "src/db/migrations";
const ERD_PATH = "src/db/erd.dbml";
const SQL_RE = /^\d{4,}_[a-z0-9_]+\.sql$/;
const UP_RE = /^\d{4,}_[a-z0-9_]+\.up\.sql$/;
const SECTION_MARKER_RE = /^\s*--\s*(up|down)\s*$/gim;
const NAME_RE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const VERSION_RE = /^(\d{4,})_.+(?:\.(?:up|down))?\.sql$/;

interface Migration {
  version: string;
  upFile: string;
  upSql: string;
  downSql: string | null;
  checksum: string;
}

interface AppliedMigration {
  version: string;
  checksum: string | null;
}

interface TableColumn {
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

interface ForeignKey {
  from: string;
  table: string;
  to: string;
}

interface TableIndex {
  name: string;
  unique: number;
  origin: string;
  partial: number;
}

const checksum = (sql: string) =>
  createHash("sha256").update(sql).digest("hex");

/** Create a reversible SQL migration: <version>_<name>.sql. */
export function createMigration(name: string): string {
  if (!NAME_RE.test(name)) {
    throw new Error(
      "Migration name must be lowercase snake_case, for example add_posts_table.",
    );
  }
  if (!existsSync(MIGRATIONS_DIR))
    mkdirSync(MIGRATIONS_DIR, { recursive: true });

  const versions = readdirSync(MIGRATIONS_DIR)
    .map((file) => VERSION_RE.exec(file)?.[1])
    .filter((version): version is string => Boolean(version))
    .map(Number);
  const version = String(
    (versions.length === 0 ? 0 : Math.max(...versions)) + 1,
  ).padStart(4, "0");
  const base = `${version}_${name}`;
  const filePath = join(MIGRATIONS_DIR, `${base}.sql`);
  if (existsSync(filePath)) {
    throw new Error(`Migration ${base} already exists.`);
  }

  const template = `# ${base} - \n\n-- up\n/*\nreplace the following SQL with your migration code
    create table "order" (
        id serial primary key,
        user_id integer not null references "user"(id),
        total numeric(10, 2) not null,
        status varchar(50) not null,
        created_at timestamp default now(),
        updated_at timestamp default now()
    );
*/

-- down

/*
replace the following SQL with your migration code
    drop table "order";
*/
`;

  writeFileSync(filePath, template);
  return filePath;
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function dbmlColumn(column: TableColumn, uniqueColumns: Set<string>): string {
  const attributes: string[] = [];
  if (column.pk) attributes.push("pk");
  if (uniqueColumns.has(column.name)) attributes.push("unique");
  if (column.notnull) attributes.push("not null");
  return `  ${column.name} ${column.type.toLowerCase() || "text"}${attributes.length ? ` [${attributes.join(", ")}]` : ""}`;
}

/** Write a DBML ERD from the database schema after a successful migration. */
export function generateErd(db: Database, filePath = ERD_PATH): void {
  const tables = db
    .query<
      { name: string },
      []
    >("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != 'schema_migrations' ORDER BY name")
    .all();
  const definitions = tables.map(({ name }) => {
    const columns = db
      .query<TableColumn, []>(`PRAGMA table_info(${quoteIdentifier(name)})`)
      .all();
    const indexes = db
      .query<TableIndex, []>(`PRAGMA index_list(${quoteIdentifier(name)})`)
      .all();
    const indexColumns = new Map(
      indexes.map((index) => [
        index.name,
        db
          .query<{ name: string }, []>(
            `PRAGMA index_info(${quoteIdentifier(index.name)})`,
          )
          .all()
          .map((column) => column.name),
      ]),
    );
    const uniqueColumns = new Set(
      indexes
        .filter((index) => index.unique && index.origin === "u")
        .flatMap((index) => indexColumns.get(index.name) ?? []),
    );
    const indexLines = indexes
      .filter((index) => index.origin === "c")
      .flatMap((index) => {
        const columns = indexColumns.get(index.name) ?? [];
        if (columns.length === 0) return [];
        const attributes = [
          index.unique ? "unique" : null,
          `name: '${index.name}'`,
          index.partial ? "note: 'partial index'" : null,
        ].filter((attribute): attribute is string => Boolean(attribute));
        return `    ${columns.join(", ")} [${attributes.join(", ")}]`;
      });
    const indexBlock = indexLines.length
      ? `\n\n  indexes {\n${indexLines.join("\n")}\n  }`
      : "";
    return `Table ${name} {\n${columns.map((column) => dbmlColumn(column, uniqueColumns)).join("\n")}${indexBlock}\n}`;
  });
  const references = tables.flatMap(({ name }) =>
    db
      .query<ForeignKey, []>(
        `PRAGMA foreign_key_list(${quoteIdentifier(name)})`,
      )
      .all()
      .map(
        (foreignKey) =>
          `Ref: ${name}.${foreignKey.from} > ${foreignKey.table}.${foreignKey.to}`,
      ),
  );
  const sections = [
    "// Generated from the migrated SQLite schema. Do not edit manually.",
    ...definitions,
    ...references,
  ];
  writeFileSync(filePath, `${sections.join("\n\n")}\n`);
}

function ensureMigrationTable(db: Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    checksum TEXT,
    applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`);
  const columns = db
    .query<{ name: string }, []>("PRAGMA table_info(schema_migrations)")
    .all();
  if (!columns.some((column) => column.name === "checksum")) {
    db.exec("ALTER TABLE schema_migrations ADD COLUMN checksum TEXT");
  }
}

function readMigrations(): Migration[] {
  if (!existsSync(MIGRATIONS_DIR)) return [];
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => UP_RE.test(file) || SQL_RE.test(file))
    .sort()
    .map((upFile) => {
      const sql = readFileSync(join(MIGRATIONS_DIR, upFile), "utf8");
      const isPaired = upFile.endsWith(".up.sql");
      const markers = isPaired
        ? []
        : [...sql.matchAll(SECTION_MARKER_RE)].map((match) => ({
            name: match[1],
            index: match.index ?? 0,
            length: match[0].length,
          }));
      const upMarker = markers.find((marker) => marker.name === "up");
      const downMarker = markers.find((marker) => marker.name === "down");
      if (!isPaired && (!upMarker || !downMarker || markers.length !== 2)) {
        throw new Error(
          `Migration ${upFile} must contain exactly one -- up marker and one -- down marker.`,
        );
      }
      if (upMarker && downMarker && upMarker.index > downMarker.index) {
        throw new Error(`Migration ${upFile} must place -- up before -- down.`);
      }
      const upSql =
        upMarker && downMarker
          ? sql.slice(upMarker.index + upMarker.length, downMarker.index).trim()
          : sql;
      const downSql = downMarker
        ? sql.slice(downMarker.index + downMarker.length).trim()
        : null;
      return {
        version: upFile,
        upFile,
        upSql,
        downSql,
        checksum: checksum(sql),
      };
    });
}

function appliedVersions(db: Database, migrations: Migration[]): Set<string> {
  const known = new Map(
    migrations.map((migration) => [migration.version, migration]),
  );
  const applied = db
    .query<
      AppliedMigration,
      []
    >("SELECT version, checksum FROM schema_migrations")
    .all();
  const updateChecksum = db.query<null, [string, string]>(
    "UPDATE schema_migrations SET checksum = ? WHERE version = ?",
  );
  for (const row of applied) {
    const migration = known.get(row.version);
    if (!migration)
      throw new Error(`Applied migration is missing from disk: ${row.version}`);
    if (row.checksum && row.checksum !== migration.checksum) {
      throw new Error(`Applied migration was modified: ${row.version}`);
    }
    if (!row.checksum) updateChecksum.run(migration.checksum, row.version);
  }
  return new Set(applied.map((row) => row.version));
}

export function migrate(db: Database): void {
  ensureMigrationTable(db);
  const migrations = readMigrations();
  const applied = appliedVersions(db, migrations);
  const insert = db.query<null, [string, string]>(
    "INSERT INTO schema_migrations (version, checksum) VALUES (?, ?)",
  );

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;
    try {
      db.transaction(() => {
        db.exec(migration.upSql);
        insert.run(migration.version, migration.checksum);
      })();
      console.log(`[migrate] applied ${migration.upFile}`);
    } catch (error) {
      throw new Error(`Failed to apply migration ${migration.upFile}`, {
        cause: error,
      });
    }
  }
}

/** Roll back exactly one latest migration with a non-empty down section. */
export function rollback(db: Database): string | null {
  ensureMigrationTable(db);
  const migrations = readMigrations();
  appliedVersions(db, migrations);
  const latest = db
    .query<
      AppliedMigration,
      []
    >("SELECT version, checksum FROM schema_migrations ORDER BY applied_at DESC, version DESC LIMIT 1")
    .get();
  if (!latest) return null;
  const migration = migrations.find((item) => item.version === latest.version);
  const downSql = migration?.downSql;
  if (!migration || !downSql) {
    throw new Error(
      `Migration ${latest.version} is up-only and cannot be rolled back.`,
    );
  }
  const remove = db.query<null, [string]>(
    "DELETE FROM schema_migrations WHERE version = ?",
  );
  db.transaction(() => {
    db.exec(downSql);
    remove.run(migration.version);
  })();
  console.log(`[migrate] rolled back ${migration.upFile}`);
  return migration.version;
}

export function migrationStatus(
  db: Database,
): Array<{ version: string; applied: boolean; reversible: boolean }> {
  ensureMigrationTable(db);
  const migrations = readMigrations();
  const applied = appliedVersions(db, migrations);
  return migrations.map((migration) => ({
    version: migration.upFile,
    applied: applied.has(migration.version),
    reversible: Boolean(migration.downSql),
  }));
}
