/**
 * API token management at /tokens — personal bearer tokens that
 * authenticate the standalone API server (src/api.ts, port API_PORT).
 *
 *   GET  /tokens              → dashboard page (list of the user's tokens)
 *   POST /tokens              → create a token (raw value returned once)
 *   POST /tokens/:id/revoke   → revoke a token (irreversible)
 *
 * Only the SHA-256 hash of a token is stored (see auth.ts#createApiToken);
 * the plaintext exists in the create response and nowhere else.
 */
import { Type as t, type Static } from "@sinclair/typebox";
import { randomUUIDv7 as tokenID } from "bun";
import { Hono } from "hono";
import { createApiToken, requireAuth, setFlash } from "../services/auth";
import {
  listApiTokensByUserId,
  revokeApiToken,
  type ApiTokenRow,
} from "../../server/repo/api-token";
import type { AppEnv } from "../middlewares/inertia-middleware";
import { config } from "../configs";
import { validateJson } from "../utils/validation";
import type { ApiToken } from "../../shared/types";

const createBody = t.Object(
  {
    name: t.String({ minLength: 2, maxLength: 60 }),
    /** null = the token never expires; otherwise 1–365 days. */
    expiresInDays: t.Union([t.Number({ minimum: 1, maximum: 365 }), t.Null()]),
  },
  { additionalProperties: false },
);

type CreateBody = Static<typeof createBody>;

/** Field messages for the create form (merged into VALIDATION_MESSAGES in app.ts).
 *  `/name` is intentionally omitted — the shared register/profile message
 *  ("Name must be at least 2 characters.") applies to tokens too. */
export const TOKEN_VALIDATION_MESSAGES: Record<string, string> = {
  "/expiresInDays": "Expiration must be between 1 and 365 days.",
};

const toApiToken = (row: ApiTokenRow): ApiToken => ({
  id: row.id,
  name: row.name,
  tokenPrefix: row.tokenPrefix,
  expiresAt: row.expiresAt,
  revokedAt: row.revokedAt,
  lastUsedAt: row.lastUsedAt,
  createdAt: row.createdAt,
});

export const tokensRoutes = () => {
  const app = new Hono<AppEnv>();

  app.get("/tokens", requireAuth, (c) => {
    const user = c.var.user;
    if (!user) return new Response("Unauthorized", { status: 401 });
    const tokens = listApiTokensByUserId.all(user.id).map(toApiToken);
    return c.var.inertia.render("Tokens", {
      tokens,
      apiPort: config.apiPort,
      createdToken: null,
    });
  });

  app.post("/tokens", requireAuth, validateJson(createBody), (c) => {
    const user = c.var.user;
    if (!user) return new Response("Unauthorized", { status: 401 });
    const body = c.req.valid("json") as CreateBody;
    const expiresAt =
      body.expiresInDays === null
        ? null
        : new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000);
    const created = createApiToken(tokenID(), user.id, body.name, expiresAt);
    const tokens = listApiTokensByUserId.all(user.id).map(toApiToken);
    return c.var.inertia.render("Tokens", {
      tokens,
      apiPort: config.apiPort,
      // The raw token is in this one response, never in the session/database.
      createdToken: created.token,
    });
  });

  app.post("/tokens/:id/revoke", requireAuth, (c) => {
    const user = c.var.user;
    if (!user) return new Response("Unauthorized", { status: 401 });
    const result = revokeApiToken.run(c.req.param("id") ?? "", user.id);
    if (c.var.sessionToken)
      setFlash(c.var.sessionToken, {
        success:
          result.changes > 0
            ? "Token revoked. Requests using it are rejected immediately."
            : "Token not found.",
      });
    return c.var.inertia.redirect("/tokens");
  });

  return app;
};
