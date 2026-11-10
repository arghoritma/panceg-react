import { db } from "../../db";

export interface UploadRow {
  id: string;
  uploadLength: number;
  offset: number;
  metadata: string;
  userId: string | null;
  path: string;
  createdAt: string;
  expiresAt: string | null;
}

export const insertUpload = db.query<
  null,
  [string, number, string, string | null, string, string | null]
>(
  `INSERT INTO uploads (id, upload_length, metadata, user_id, path, expires_at)
   VALUES (?, ?, ?, ?, ?, ?)`,
);

export const findUpload = db.query<UploadRow, [string]>(
  `SELECT id, upload_length AS uploadLength, offset, metadata, user_id AS userId, path, created_at AS createdAt, expires_at AS expiresAt FROM uploads WHERE id = ?`,
);

/** Atomically advance the offset only if the current offset matches `expected`.
 *  Returns the number of rows updated (1 on success, 0 on conflict). */

export const advanceOffset = db.query<{ n: number }, [number, string, number]>(
  `UPDATE uploads SET offset = offset + ? WHERE id = ? AND offset = ? RETURNING 1 AS n`,
);

export const deleteUpload = db.query<null, [string]>(
  `DELETE FROM uploads WHERE id = ?`,
);

/** Uploads whose expiration has passed (used by the sweep job). Caller passes
 *  `now` (ISO) so tests can control time. */

export const listExpired = db.query<UploadRow, [string]>(
  `SELECT id, upload_length AS uploadLength, offset, metadata, user_id AS userId, path, created_at AS createdAt, expires_at AS expiresAt FROM uploads WHERE expires_at IS NOT NULL AND expires_at < ?`,
);
