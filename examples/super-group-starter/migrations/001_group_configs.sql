-- D1 schema for Super Group Starter
CREATE TABLE IF NOT EXISTS group_configs (
  owner_id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Helpful index if scanning by channel
CREATE INDEX IF NOT EXISTS idx_group_configs_channel_id ON group_configs(channel_id);
