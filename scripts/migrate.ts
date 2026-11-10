/** CLI migration runner. It opens the database without application statements. */
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "../src/server/configs";
import {
  generateErd,
  migrate,
  migrationStatus,
  rollback,
} from "../src/db/migrations";

if (config.dbPath !== ":memory:") {
  mkdirSync(dirname(config.dbPath), { recursive: true });
}

const db = new Database(config.dbPath, { create: true });
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA synchronous = NORMAL");
db.exec("PRAGMA busy_timeout = 5000");
db.exec("PRAGMA foreign_keys = ON");

const command = process.argv[2] ?? "up";

try {
  if (command === "up") {
    migrate(db);
    generateErd(db);
  } else if (command === "down") {
    if (!rollback(db)) console.log("No migrations to roll back.");
    generateErd(db);
  } else if (command === "status") {
    for (const migration of migrationStatus(db)) {
      console.log(
        `${migration.applied ? "applied" : "pending"}\t${migration.reversible ? "reversible" : "up-only"}\t${migration.version}`,
      );
    }
  } else {
    throw new Error(
      "Usage: bun run db:migrate [up|status] | bun run db:rollback",
    );
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[migrate] failed: ${message}`);
  process.exitCode = 1;
} finally {
  db.close();
}
