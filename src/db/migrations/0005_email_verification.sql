# 0005_email_verification.sql — email verification tokens.

-- up
CREATE TABLE IF NOT EXISTS email_verifications (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT(
        strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')
    )
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications (user_id);

-- down
DROP TABLE IF EXISTS email_verifications;