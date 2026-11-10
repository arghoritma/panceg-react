# 0001_users.sql — application users (password + Google OAuth + roles).

-- up

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    google_id TEXT,
    avatar_url TEXT,
    created_at TEXT NOT NULL DEFAULT(
        strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')
    ),
    email_verified INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id)
WHERE
    google_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- down
DROP TABLE IF EXISTS users;
DROP INDEX IF EXISTS idx_users_google_id;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_name;