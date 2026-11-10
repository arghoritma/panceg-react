/**
 * Standalone API server entry point — separate process, separate port
 * (API_PORT, default 4001), same database as the web server.
 *
 *   bun run dev:api    → watch mode
 *   bun run start:api  → production (NODE_ENV=production)
 *
 * Auth: personal bearer tokens generated from the web dashboard (/tokens).
 */

import { createApiApp } from "./server/api";
import { config } from "./server/configs";
import { db } from "./db";

const server = Bun.serve({
  hostname: config.host,
  port: config.apiPort,
  fetch: createApiApp().fetch,
});

console.log(`API server → http://${config.host}:${config.apiPort}`);

function shutdown(signal: string): void {
  console.log(`\n${signal} received — shutting down API server`);
  server.stop(true); // graceful: wait for in-flight requests
  db.close();
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
  process.exit(1);
});
