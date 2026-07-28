-- 可可的工作台 - D1 数据库 Schema
--
-- 在 Cloudflare Dashboard 中创建 D1 数据库后，执行以下 SQL 创建表
-- 或者通过 wrangler 命令行：
--   wrangler d1 execute keke-workbench-db --file=./schema.sql

CREATE TABLE IF NOT EXISTS app_data (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 索引：按更新时间排序（用于同步最近变更，可选）
CREATE INDEX IF NOT EXISTS idx_app_data_updated_at ON app_data(updated_at);

-- 初始数据（可选）
-- INSERT OR IGNORE INTO app_data (key, value, updated_at) VALUES ('bookmarks', '[]', datetime('now'));
