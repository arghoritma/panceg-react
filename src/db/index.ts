/**
 * bun:sqlite layer — synchronous, zero-ORM.
 * Schema comes from migrations/ (see migrations.ts); statements are
 * prepared once, after migrations are applied.
 */

import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "../server/configs";
import { migrate } from "./migrations";

if (config.dbPath !== ":memory:")
  mkdirSync(dirname(config.dbPath), { recursive: true });

export const db = new Database(config.dbPath, { create: true });

db.exec("PRAGMA journal_mode = WAL");
// WAL + synchronous=NORMAL: skip fsync per commit — measured ~27× faster
// writes (3.5K → 95K/s on M4 NVMe, ~48× on HDD VPS). Tradeoff: on power
// loss the last transactions in WAL may be lost (DB stays consistent).
// Use FULL for zero-loss requirements (e.g. financial transactions).
db.exec("PRAGMA synchronous = NORMAL");
// Concurrent writes (e.g. two tus PATCHes) wait up to 5s instead of
// failing with SQLITE_BUSY.
db.exec("PRAGMA busy_timeout = 5000");
db.exec("PRAGMA foreign_keys = ON");

// CLI mode lets release tooling migrate before the application is restarted.
if (config.migrations.mode === "startup") migrate(db);

/** Cheap liveness probe for the /health endpoint. */
export const pingDb = db.query<{ n: number }, []>(`SELECT 1 AS n`);
