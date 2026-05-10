-- ========================================
-- 创建迁移历史记录表
-- 用于跟踪哪些迁移脚本已经执行过
-- ========================================

CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INTEGER NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'success'
);

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_schema_migrations_filename ON schema_migrations(filename);
CREATE INDEX IF NOT EXISTS idx_schema_migrations_status ON schema_migrations(status);

-- 插入初始记录（如果 migration_complete_v4.sql 已经在数据库中执行过）
-- 这条语句会在首次运行自动迁移时被跳过，因为此时表是空的