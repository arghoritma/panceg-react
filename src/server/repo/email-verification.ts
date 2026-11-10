import { db } from "../../db";

export interface EmailVerificationRow {
  tokenHash: string;
  userId: string;
  expiresAt: string;
}

export const insertEmailVerification = db.query<null, [string, string, string]>(
  `INSERT INTO email_verifications (token_hash, user_id, expires_at) VALUES (?, ?, ?)`,
);

export const findEmailVerification = db.query<EmailVerificationRow, [string]>(
  `SELECT token_hash AS tokenHash, user_id AS userId, expires_at AS expiresAt FROM email_verifications WHERE token_hash = ?`,
);

export const deleteEmailVerification = db.query<null, [string]>(
  `DELETE FROM email_verifications WHERE token_hash = ?`,
);

export const deleteUserEmailVerifications = db.query<null, [string]>(
  `DELETE FROM email_verifications WHERE user_id = ?`,
);

export const verifyUserEmail = db.query<null, [string]>(
  `UPDATE users SET email_verified = 1 WHERE id = ?`,
);
