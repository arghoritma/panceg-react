/**
 * Centralised, validated configuration. Reads process.env once at startup
 * and fails fast with a clear message when the active setup is incomplete
 * (e.g. MAIL_DRIVER=resend without RESEND_API_KEY).
 *
 * Note: tests override env vars before importing modules, so config is
 * always derived fresh per process.
 */

export type MailDriver = "log" | "resend" | "mailtrap";
export type Role = "user" | "admin";
export type MigrationsMode = "startup" | "cli";

const pick = <T>(value: T | undefined, fallback: T): T =>
  value === undefined || value === "" ? fallback : value;

const problems: string[] = [];

function integer(
  name: string,
  value: string | undefined,
  fallback: string,
  minimum: number,
): number {
  const parsed = Number(pick(value, fallback));
  if (!Number.isInteger(parsed) || parsed < minimum) {
    problems.push(`${name} must be an integer greater than or equal to ${minimum}`);
  }
  return parsed;
}

const migrationsMode = (process.env.MIGRATIONS_MODE ?? "startup").toLowerCase();
if (migrationsMode !== "startup" && migrationsMode !== "cli") {
  problems.push("MIGRATIONS_MODE must be `startup` or `cli`");
}

const mailDriver = (
  process.env.MAIL_DRIVER ?? "log"
).toLowerCase() as MailDriver;
if (!["log", "resend", "mailtrap"].includes(mailDriver)) {
  problems.push(
    `MAIL_DRIVER must be one of log|resend|mailtrap (got "${mailDriver}")`,
  );
}

const resendApiKey = process.env.RESEND_API_KEY ?? "";
if (mailDriver === "resend" && !resendApiKey)
  problems.push("MAIL_DRIVER=resend requires RESEND_API_KEY");

const mailtrapToken = process.env.MAILTRAP_API_TOKEN ?? "";
if (mailDriver === "mailtrap" && !mailtrapToken)
  problems.push("MAIL_DRIVER=mailtrap requires MAILTRAP_API_TOKEN");

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";

if (Boolean(googleClientId) !== Boolean(googleClientSecret)) {
  problems.push(
    "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set together (Google OAuth stays disabled otherwise)",
  );
}

const port = integer("PORT", process.env.PORT, "4000", 1);
const apiPort = integer("API_PORT", process.env.API_PORT, "4001", 1);
if (port > 65535) problems.push("PORT must be less than or equal to 65535");
if (apiPort > 65535)
  problems.push("API_PORT must be less than or equal to 65535");
const maxSize = integer("TUS_MAX_SIZE", process.env.TUS_MAX_SIZE, "0", 0);
const expirationSeconds = integer(
  "TUS_EXPIRATION_SECONDS",
  process.env.TUS_EXPIRATION_SECONDS,
  "0",
  0,
);
const globalMax = integer(
  "RATE_LIMIT_GLOBAL_MAX",
  process.env.RATE_LIMIT_GLOBAL_MAX,
  "200",
  1,
);
const globalWindow = integer(
  "RATE_LIMIT_GLOBAL_WINDOW",
  process.env.RATE_LIMIT_GLOBAL_WINDOW,
  "60",
  1,
);
const authMax = integer(
  "RATE_LIMIT_AUTH_MAX",
  process.env.RATE_LIMIT_AUTH_MAX,
  "30",
  1,
);
const authWindow = integer(
  "RATE_LIMIT_AUTH_WINDOW",
  process.env.RATE_LIMIT_AUTH_WINDOW,
  "60",
  1,
);

if (problems.length > 0) {
  throw new Error(`Invalid configuration:\n  - ${problems.join("\n  - ")}`);
}

export const config = {
  isProd: process.env.NODE_ENV === "production",
  host: pick(
    process.env.HOST,
    process.env.NODE_ENV === "production" ? "127.0.0.1" : "0.0.0.0",
  ),
  migrations: { mode: migrationsMode as MigrationsMode },
  ssr: process.env.SSR !== "false",
  port,
  apiPort,
  appUrl: pick(process.env.APP_URL, "http://localhost:4000").replace(
    /\/+$/,
    "",
  ),
  dbPath: pick(process.env.DATABASE_PATH, "./data/app.sqlite"),
  upload: {
    dir: pick(process.env.UPLOAD_DIR, "./data/uploads"),
    maxSize,
    expirationSeconds,
  },
  mail: {
    driver: mailDriver,
    from: pick(process.env.MAIL_FROM, "no-reply@example.com"),
    resendApiKey,
    mailtrapToken,
    mailtrapInboxId: process.env.MAILTRAP_INBOX_ID ?? "",
  },
  google: {
    clientId: googleClientId || null,
    clientSecret: googleClientSecret || null,
  },
  rateLimit: {
    globalMax,
    globalWindow,
    authMax,
    authWindow,
  },
  metricsToken: process.env.METRICS_TOKEN ?? "",
};
