import { db } from "../../db";

export interface ApiTokenRow {
  id: string;
  userId: string;
  name: string;
  tokenHash: string;
  tokenPrefix: string;
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export const insertApiToken = db.query<
  null,
  [string, string, string, string, string, string | null]
>(
  `INSERT INTO api_tokens (id, user_id, name, token_hash, token_prefix, expires_at)
   VALUES (?, ?, ?, ?, ?, ?)`,
);

export const findApiTokenByHash = db.query<ApiTokenRow, [string]>(
  `SELECT id, user_id AS userId, name, token_hash AS tokenHash,
          token_prefix AS tokenPrefix, expires_at AS expiresAt,
          revoked_at AS revokedAt, last_used_at AS lastUsedAt,
          created_at AS createdAt
   FROM api_tokens WHERE token_hash = ?`,
);

export const listApiTokensByUserId = db.query<ApiTokenRow, [string]>(
  `SELECT id, user_id AS userId, name, token_hash AS tokenHash,
          token_prefix AS tokenPrefix, expires_at AS expiresAt,
          revoked_at AS revokedAt, last_used_at AS lastUsedAt,
          created_at AS createdAt
   FROM api_tokens WHERE user_id = ? ORDER BY created_at DESC`,
);

export const revokeApiToken = db.query<null, [string, string]>(
  `UPDATE api_tokens
   SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
   WHERE id = ? AND user_id = ? AND revoked_at IS NULL`,
);

export const touchApiToken = db.query<null, [string]>(
  `UPDATE api_tokens
   SET last_used_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
   WHERE id = ?`,
);
