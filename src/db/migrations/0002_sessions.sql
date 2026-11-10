# 0002_sessions.sql — application sessions (user login sessions).

-- up

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    flash TEXT NOT NULL DEFAULT '{}',
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT(
        strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')
    )
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);

-- down
DROP TABLE IF EXISTS sessions;
DROP INDEX IF EXISTS idx_sessions_user_id;