-- ========================================
-- 添加用户最近登录时间字段
-- ========================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

COMMENT ON COLUMN users.last_login_at IS '最近登录时间';
