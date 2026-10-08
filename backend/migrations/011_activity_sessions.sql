CREATE TABLE activity_sessions (
  id UUID PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active_seconds INTEGER NOT NULL DEFAULT 0 CHECK (active_seconds BETWEEN 0 AND 86400)
);
CREATE INDEX activity_sessions_started_idx ON activity_sessions(started_at);
CREATE INDEX activity_sessions_seen_idx ON activity_sessions(last_seen_at);
