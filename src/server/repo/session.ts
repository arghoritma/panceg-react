import { db } from "../../db";

export interface PasswordResetRow {
  email: string;
  tokenHash: string;
  expiresAt: string;
}

export interface SessionRow {
  tokenHash: string;
  userId: string;
  flash: string;
  expiresAt: string;
  createdAt: string;
}

export const insertSession = db.query<null, [string, string, string]>(
  `INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)`,
);

export const findSession = db.query<SessionRow, [string]>(
  `SELECT token_hash AS tokenHash, user_id AS userId, flash, expires_at AS expiresAt, created_at AS createdAt FROM sessions WHERE token_hash = ?`,
);

export const deleteSession = db.query<null, [string]>(
  `DELETE FROM sessions WHERE token_hash = ?`,
);

export const deleteOtherSessions = db.query<null, [string, string]>(
  `DELETE FROM sessions WHERE user_id = ? AND token_hash != ?`,
);

export const updateSessionFlash = db.query<null, [string, string]>(
  `UPDATE sessions SET flash = ? WHERE token_hash = ?`,
);

// ---------------------------------------------------------------------------
// Password resets
// ---------------------------------------------------------------------------

export const insertPasswordReset = db.query<null, [string, string, string]>(
  `INSERT INTO password_resets (email, token_hash, expires_at) VALUES (?, ?, ?)`,
);

export const findPasswordReset = db.query<PasswordResetRow, [string]>(
  `SELECT email, token_hash AS tokenHash, expires_at AS expiresAt FROM password_resets WHERE token_hash = ?`,
);

export const deletePasswordResetsByEmail = db.query<null, [string]>(
  `DELETE FROM password_resets WHERE email = ?`,
);
