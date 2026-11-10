/**
 * Client-side data API. Decouples user/session data from Inertia page
 * payloads so public page HTML stays identical for all visitors and can
 * be cached at the CDN edge (Cloudflare).
 *
 *   GET /api/session → { user, flash }  (clears flash)
 *
 * The client calls this once on boot (see `src/client/session.ts`).
 * Public page components read user identity from the session store, not
 * from Inertia page props. Auth pages still receive `auth.user` via
 * Inertia props directly — this endpoint is only for cacheable public pages.
 *
 * All responses are `Cache-Control: private, no-store` — never cached at
 * the edge.
 */
import { randomUUIDv7 as userID } from "bun";
import { Type as t, type Static } from "@sinclair/typebox";
import { Hono } from "hono";
import { clearFlash, requireApiAuth, verifyPassword } from "../services/auth";
import { noStore } from "../middlewares/cache";
import type { AppEnv } from "../middlewares/inertia-middleware";
import type { FlashData, User } from "../../shared/types";
import { validateJson } from "../utils/validation";
import { createUser, findUserByEmail } from "../../server/repo/user";
import {
  hashPassword,
  deleteSessionByToken,
  createSession,
  setSessionCookie,
  createEmailVerification,
} from "../services/auth";
import { sendMail } from "../services/mailer";
import { config } from "../configs";

const registerBody = t.Object(
  {
    name: t.String({ minLength: 2, maxLength: 80 }),
    email: t.String({ format: "email" }),
    password: t.String({ minLength: 8, maxLength: 72 }),
  },
  { additionalProperties: false },
);

const loginBody = t.Object(
  {
    email: t.String({ format: "email" }),
    password: t.String({ minLength: 8, maxLength: 72 }),
  },
  {
    additionalProperties: false,
  },
);

type RegisterBody = Static<typeof registerBody>;
type LoginBody = Static<typeof loginBody>;

export const apiRoutes = () => {
  const app = new Hono<AppEnv>();

  app.get("/session", noStore, (c) => {
    const user: User | null = c.var.user;
    const flash: FlashData = c.var.flash;
    if (c.var.sessionToken) clearFlash(c.var.sessionToken);
    return c.json({ user, flash });
  });

  app.get("/health", noStore, (c) => {
    return c.json({
      health: "sehat",
    });
  });

  app.post("/register", validateJson(registerBody), async (c) => {
    const userId = userID();
    const body = c.req.valid("json") as RegisterBody;

    if (findUserByEmail.get(body.email)) {
      return c.json({
        error: "That email is already registered.",
      });
    }
    const passwordHash = await hashPassword(body.password);
    const user = createUser.get(userId, body.name, body.email, passwordHash);

    if (!user)
      return c.json(
        {
          error: "Could not create your account.",
        },
        400,
      );
    // Rotate the session cookie if one exists (session fixation defense).
    if (c.var.sessionToken) deleteSessionByToken(c.var.sessionToken);
    const session = createSession(user.id);
    setSessionCookie(c, session.token, session.expiresAt);
    // Send verification email (best-effort — don't block registration).
    const token = createEmailVerification(user.id);
    const link = `${config.appUrl}/verify-email?token=${token}`;
    await sendMail({
      to: body.email,
      subject: "Verify your email",
      text: `Welcome to Panceg!\n\nPlease verify your email address:\n${link}\n\nThis link expires in 24 hours.`,
      html: `<p>Welcome to Panceg!</p><p><a href="${link}">Verify your email</a></p><p>This link expires in 24 hours.</p>`,
    }).catch((err) =>
      console.error("[mail] failed to send verification email:", err),
    );
    return c.json(
      {
        id: user.id,
        email: body.email,
      },
      200,
    );
  });

  app.post("/login", validateJson(loginBody), async (c) => {
    const body = c.req.valid("json") as LoginBody;

    const user = findUserByEmail.get(body.email);

    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return c.json(
        {
          email: "These credentials do not match our records.",
        },
        401,
      );
    }

    if (c.var.sessionToken) deleteSessionByToken(c.var.sessionToken);

    const session = createSession(user.id);

    return c.json(
      {
        session: session.token,
        login: body.email,
      },
      200,
    );
  });

  app.get("/protected", requireApiAuth, noStore, (c) => {
    return c.json({
      message: "This is a protected route.",
      pass: "pass",
      user: c.var.user,
    });
  });

  return app;
};
