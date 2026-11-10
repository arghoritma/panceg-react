/**
 * Standalone API server composition — JSON only, no Inertia/SSR/assets.
 * Runs as its own process on `config.apiPort` (src/api.ts) against the
 * same SQLite database as the web server, so tokens created in the web
 * dashboard authenticate API requests here.
 *
 * Middleware order mirrors app.ts: logging → rate limit → routes →
 * JSON error/not-found handlers.
 */
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { config } from "./configs";
import { rateLimit } from "./middlewares/rate-limit";
import type { AppEnv } from "./middlewares/inertia-middleware";
import { logError, requestLogger } from "./services/logger";
import { pingDb } from "../db";
import { v1Routes } from "./routes/apis/v1.routes";
import { safeUrl } from "./middlewares/url";

export function createApiApp() {
  const app = new Hono<AppEnv>();

  app.use(requestLogger);

  // Global per-IP limit (same knobs as the web server), /health exempt.
  const limiter = rateLimit({
    max: config.rateLimit.globalMax,
    windowSeconds: config.rateLimit.globalWindow,
  });
  app.use((c, next) =>
    safeUrl(c.req.url).pathname === "/health" ? next() : limiter(c, next),
  );

  app.onError(async (err, c) => {
    logError(c, err);
    if (err instanceof HTTPException) return err.getResponse();
    return c.json({ error: "Internal Server Error" }, 500);
  });

  app.notFound((c) => c.json({ error: "route not found" }, 404));

  app.get("/health", (c) => {
    pingDb.get();
    return c.json({ status: "ok", uptime: process.uptime() });
  });

  app.route("/v1", v1Routes());

  return app;
}
