import { db } from "../../db";
import type { Role } from "../../shared/types";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  googleId: string | null;
  avatarUrl: string | null;
  emailVerified: number; // 0 or 1 (SQLite boolean)
  createdAt: string;
}

/** The user shape that may leave the server (never includes passwordHash). */
export type PublicUser = Omit<
  UserRow,
  "passwordHash" | "googleId" | "emailVerified"
> & { emailVerified: boolean };

export const toPublicUser = (row: UserRow): PublicUser => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  avatarUrl: row.avatarUrl,
  emailVerified: row.emailVerified === 1,
  createdAt: row.createdAt,
});

export const createUser = db.query<
  { id: string },
  [string, string, string, string]
>(
  `INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?) RETURNING id`,
);

export const createUserWithRole = db.query<
  { id: string },
  [string, string, string, string, Role]
>(
  `INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?) RETURNING id`,
);

export const createGoogleUser = db.query<
  { id: string },
  [string, string, string, string, string]
>(
  `INSERT INTO users (id, name, email, password_hash, google_id, avatar_url) VALUES (?, ?, ?, '', ?, ?) RETURNING id`,
);

export const findUserByEmail = db.query<UserRow, [string]>(
  `SELECT id, name, email, password_hash AS passwordHash, role, google_id AS googleId, avatar_url AS avatarUrl, email_verified AS emailVerified, created_at AS createdAt FROM users WHERE email = ?`,
);

export const findUserById = db.query<UserRow, [string]>(
  `SELECT id, name, email, password_hash AS passwordHash, role, google_id AS googleId, avatar_url AS avatarUrl, email_verified AS emailVerified, created_at AS createdAt FROM users WHERE id = ?`,
);

export const findUserByGoogleId = db.query<UserRow, [string]>(
  `SELECT id, name, email, password_hash AS passwordHash, role, google_id AS googleId, avatar_url AS avatarUrl, email_verified AS emailVerified, created_at AS createdAt FROM users WHERE google_id = ?`,
);

export const linkGoogleAccount = db.query<null, [string, string]>(
  `UPDATE users SET google_id = ? WHERE id = ?`,
);

export const updateUserPassword = db.query<null, [string, string]>(
  `UPDATE users SET password_hash = ? WHERE id = ?`,
);

export const updateUserAvatar = db.query<null, [string, string]>(
  `UPDATE users SET avatar_url = ? WHERE id = ?`,
);

export const updateUserProfile = db.query<null, [string, string, string]>(
  `UPDATE users SET name = ?, email = ? WHERE id = ?`,
);

export const countUsers = db.query<{ n: number }, []>(
  `SELECT COUNT(*) AS n FROM users`,
);

export const listUsers = db.query<UserRow, [number, number]>(
  `SELECT id, name, email, password_hash AS passwordHash, role, google_id AS googleId, avatar_url AS avatarUrl, email_verified AS emailVerified, created_at AS createdAt FROM users ORDER BY id DESC LIMIT ? OFFSET ?`,
);

export const recentUsers = db.query<UserRow, [number]>(
  `SELECT id, name, email, password_hash AS passwordHash, role, google_id AS googleId, avatar_url AS avatarUrl, email_verified AS emailVerified, created_at AS createdAt FROM users ORDER BY id DESC LIMIT ?`,
);
