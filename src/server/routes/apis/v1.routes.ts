/**
 * Versioned routes of the standalone API server (mounted at /v1).
 *
 * Every route behind `requireApiAuth` needs a personal bearer token
 * generated from the web dashboard (/tokens):
 *
 *   Authorization: Bearer dlk_<64 hex chars>
 *
 * Responses are plain JSON — no Inertia, no SSR, no cookies.
 */
import { Hono } from "hono";
import { requireApiAuth } from "../../services/auth";
import { noStore } from "../../middlewares/cache";
import type { AppEnv } from "../../middlewares/inertia-middleware";

export const v1Routes = () => {
  const app = new Hono<AppEnv>();

  app.use("*", requireApiAuth, noStore);

  app.get("/me", (c) => c.json({ user: c.var.user }, 200));

  return app;
};
