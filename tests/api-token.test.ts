/**
 * Personal API token + standalone API server suite.
 * Boots the web app (Inertia) and the JSON-only API app against one
 * in-memory database, then drives both via app.request().
 * Run with: bun test --isolate
 */
import { afterAll, beforeAll, describe, expect, it } from "bun:test";

let app: Awaited<ReturnType<(typeof import("../src/server/app"))["createApp"]>>;
let apiApp: ReturnType<(typeof import("../src/server/api"))["createApiApp"]>;

beforeAll(async () => {
  // Must be set before any app module is imported (config/db read env at import).
  process.env.DATABASE_PATH = ":memory:";
  process.env.APP_URL = "http://localhost:3000";
  process.env.API_PORT = "4001";
  process.env.RATE_LIMIT_AUTH_MAX = "1000";
  process.env.RATE_LIMIT_GLOBAL_MAX = "10000";
  const { buildClientAssets } = await import("../src/server/services/assets");
  await buildClientAssets();
  const { createApp } = await import("../src/server/app");
  const { createApiApp } = await import("../src/server/api");
  app = createApp({ version: "test-version", js: "app.js", css: "app.css" });
  apiApp = createApiApp();
});

afterAll(async () => {
  const { db } = await import("../src/db");
  db.close();
});

const WEB = "http://localhost:3000";
const API = "http://localhost:4001";

interface CallOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  cookie?: string;
}

async function call(
  path: string,
  options: CallOptions = {},
  base = WEB,
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (options.cookie) headers.set("cookie", options.cookie);
  let body: string | undefined;
  if (options.body) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(options.body);
  }
  // base selects the process: WEB → Inertia app, API → standalone JSON app.
  return (base === WEB ? app : apiApp).request(`${base}${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
  });
}

const xhr = { "x-inertia": "true" };

function sessionCookie(res: Response): string {
  const headers = res.headers as Headers & { getSetCookie?: () => string[] };
  const all =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : [res.headers.get("set-cookie") ?? ""].filter(Boolean);
  const cookie = all.find((c) => c.startsWith("session="));
  return cookie ? cookie.split(";")[0]! : "";
}

async function registerUser(email: string): Promise<string> {
  const res = await call("/register", {
    method: "POST",
    headers: xhr,
    body: { name: "Token Owner", email, password: "password123" },
  });
  expect(res.status).toBe(303);
  return sessionCookie(res);
}

/** Create a token through the dashboard flow; returns cookie + raw token. */
async function createToken(
  cookie: string,
  name = "CI pipeline",
  expiresInDays: number | null = 30,
): Promise<{ cookie: string; raw: string; id: string }> {
  const created = await call("/tokens", {
    method: "POST",
    headers: xhr,
    cookie,
    body: { name, expiresInDays },
  });
  expect(created.status).toBe(200);
  // biome-ignore lint/suspicious/noExplicitAny: test helper returns untyped JSON
  const data: any = await created.json();
  expect(data.props.createdToken).toMatch(/^dlk_[0-9a-f]{64}$/);
  const token = data.props.tokens.find(
    (t: { name: string }) => t.name === name,
  );
  expect(token).toBeDefined();
  return {
    cookie,
    raw: data.props.createdToken as string,
    id: token.id as string,
  };
}

// biome-ignore lint/suspicious/noExplicitAny: test helper returns untyped JSON
async function page(res: Response): Promise<any> {
  return res.json();
}

describe("dashboard token management", () => {
  it("requires a session", async () => {
    const res = await call("/tokens");
    expect(res.status).toBe(302);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });

  it("creates a token, reveals the raw value once, never exposes it again", async () => {
    const cookie = await registerUser("tokens@example.com");
    const { raw, id } = await createToken(cookie);

    expect(raw).toMatch(/^dlk_[0-9a-f]{64}$/);

    // The list payload carries only public metadata.
    const listed = await call("/tokens", { headers: { ...xhr, cookie } });
    const data = await page(listed);
    const entry = data.props.tokens.find((t: { id: string }) => t.id === id);
    expect(entry.tokenPrefix).toBe(raw.slice(0, 12));
    expect(entry.tokenPrefix.startsWith("dlk_")).toBe(true);
    expect(JSON.stringify(data.props.tokens)).not.toContain(raw);
    expect("tokenHash" in entry).toBe(false);
    expect(data.props.apiPort).toBe(4001);

    // The raw token was only in the creation response; a normal page render
    // never includes it again.
    const second = await call("/tokens", { headers: { ...xhr, cookie } });
    const secondData = await page(second);
    expect(secondData.props.createdToken).toBeNull();
  });

  it("stores only a SHA-256 hash at rest", async () => {
    const cookie = await registerUser("hashonly@example.com");
    const { raw } = await createToken(cookie, "Hash check");

    const { hashToken } = await import("../src/server/services/auth");
    const { findApiTokenByHash } = await import("../src/server/repo/api-token");
    const row = findApiTokenByHash.get(hashToken(raw));
    expect(row).not.toBeNull();
    expect(row!.tokenHash).not.toBe(raw);
    expect(row!.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(row)).not.toContain(raw);
  });

  it("validates the name field", async () => {
    const cookie = await registerUser("validation@example.com");
    const res = await call("/tokens", {
      method: "POST",
      headers: xhr,
      cookie,
      body: { name: "x", expiresInDays: null },
    });
    expect(res.status).toBe(422);
    const data = await page(res);
    expect(data.component).toBe("Tokens");
    expect(data.props.errors.name).toBe("Name must be at least 2 characters.");
  });

  it("validates the expiration range", async () => {
    const cookie = await registerUser("validation2@example.com");
    const res = await call("/tokens", {
      method: "POST",
      headers: xhr,
      cookie,
      body: { name: "Long lived", expiresInDays: 400 },
    });
    expect(res.status).toBe(422);
    const data = await page(res);
    expect(data.props.errors.expiresInDays).toBe(
      "Expiration must be between 1 and 365 days.",
    );
  });

  it("revokes a token from the dashboard", async () => {
    const cookie = await registerUser("revoke@example.com");
    const { id } = await createToken(cookie, "Revoke me");

    const res = await call(`/tokens/${id}/revoke`, {
      method: "POST",
      headers: xhr,
      cookie,
    });
    expect(res.status).toBe(303);

    const listed = await call("/tokens", { headers: { ...xhr, cookie } });
    const data = await page(listed);
    const entry = data.props.tokens.find((t: { id: string }) => t.id === id);
    expect(entry.revokedAt).not.toBeNull();

    // Revoking twice is harmless (token not found notice).
    const again = await call(`/tokens/${id}/revoke`, {
      method: "POST",
      headers: xhr,
      cookie,
    });
    expect(again.status).toBe(303);
  });
});

describe("standalone API server", () => {
  it("GET /health is public (no token required)", async () => {
    const res = await call("/health", {}, API);
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("ok");
  });

  it("rejects a missing bearer token with 401 + WWW-Authenticate", async () => {
    const res = await call("/v1/me", {}, API);
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toBe("Bearer");
    expect((await res.json()).error).toContain("Token tidak ditemukan");
  });

  it("rejects an unknown bearer token", async () => {
    const res = await call(
      "/v1/me",
      { headers: { authorization: `Bearer dlk_${"0".repeat(64)}` } },
      API,
    );
    expect(res.status).toBe(401);
    expect((await res.json()).error).toContain("kedaluwarsa");
  });

  it("authenticates a dashboard-generated token and returns the owner", async () => {
    const cookie = await registerUser("apicaller@example.com");
    const { raw } = await createToken(cookie, "API caller");

    const res = await call(
      "/v1/me",
      { headers: { authorization: `Bearer ${raw}` } },
      API,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    const body = await res.json();
    expect(body.user.email).toBe("apicaller@example.com");
    expect(body.user.passwordHash).toBeUndefined();

    // last_used_at is recorded for the dashboard.
    const { hashToken } = await import("../src/server/services/auth");
    const { findApiTokenByHash } = await import("../src/server/repo/api-token");
    const row = findApiTokenByHash.get(hashToken(raw));
    expect(row!.lastUsedAt).not.toBeNull();
  });

  it("stops accepting a token the moment it is revoked", async () => {
    const cookie = await registerUser("revokeapi@example.com");
    const { raw, id } = await createToken(cookie, "Revoke via API");

    const before = await call(
      "/v1/me",
      { headers: { authorization: `Bearer ${raw}` } },
      API,
    );
    expect(before.status).toBe(200);

    await call(`/tokens/${id}/revoke`, {
      method: "POST",
      headers: xhr,
      cookie,
    });

    const after = await call(
      "/v1/me",
      { headers: { authorization: `Bearer ${raw}` } },
      API,
    );
    expect(after.status).toBe(401);
  });

  it("rejects an expired token", async () => {
    const cookie = await registerUser("expired@example.com");
    const { raw } = await createToken(cookie, "Expiring", 30);

    const { createApiToken } = await import("../src/server/services/auth");
    const { findUserByEmail } = await import("../src/server/repo/user");
    const { randomUUIDv7 } = await import("bun");
    const user = findUserByEmail.get("expired@example.com")!;
    const expired = createApiToken(
      randomUUIDv7(),
      user.id,
      "Already expired",
      new Date(Date.now() - 1000),
    );

    const live = await call(
      "/v1/me",
      { headers: { authorization: `Bearer ${raw}` } },
      API,
    );
    expect(live.status).toBe(200);

    const res = await call(
      "/v1/me",
      { headers: { authorization: `Bearer ${expired.token}` } },
      API,
    );
    expect(res.status).toBe(401);
  });

  it("also authenticates the web server's /api/protected route", async () => {
    const cookie = await registerUser("protected@example.com");
    const { raw } = await createToken(cookie, "Web protected");

    const res = await call("/api/protected", {
      headers: { authorization: `Bearer ${raw}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe("protected@example.com");

    const anonymous = await call("/api/protected");
    expect(anonymous.status).toBe(401);
  });

  it("returns JSON 404 for unknown API routes", async () => {
    const noAuth = await call("/v1/nope", {}, API);
    expect(noAuth.status).toBe(401); // auth runs before routing

    const cookie = await registerUser("notfound@example.com");
    const { raw } = await createToken(cookie, "404 check");
    const authenticated = await call(
      "/v1/nope",
      { headers: { authorization: `Bearer ${raw}` } },
      API,
    );
    expect(authenticated.status).toBe(404);
    expect((await authenticated.json()).error).toBe("route not found");

    const outsideV1 = await call("/nope", {}, API);
    expect(outsideV1.status).toBe(404);
    expect((await outsideV1.json()).error).toBe("route not found");
  });
});
