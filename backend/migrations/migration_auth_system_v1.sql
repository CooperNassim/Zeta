-- ========================================
-- 账号认证系统表 (v1)
-- 用途：存储用户账号、会话和登录日志数据
-- 包含表：users, user_sessions, login_logs
-- ========================================

-- ========================================
-- 用户表
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'trader', 'viewer')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

-- users 表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- users 表注释
COMMENT ON TABLE users IS '用户表 - 存储系统用户账号信息';
COMMENT ON COLUMN users.id IS '用户ID';
COMMENT ON COLUMN users.username IS '用户名（唯一）';
COMMENT ON COLUMN users.password_hash IS '密码哈希值';
COMMENT ON COLUMN users.role IS '用户角色：admin(管理员), trader(交易员), viewer(观察者)';
COMMENT ON COLUMN users.status IS '用户状态：active(活跃), inactive(停用)';
COMMENT ON COLUMN users.created_at IS '创建时间';
COMMENT ON COLUMN users.updated_at IS '更新时间';
COMMENT ON COLUMN users.deleted IS '是否软删除';
COMMENT ON COLUMN users.deleted_at IS '删除时间';

-- ========================================
-- 用户会话表
-- ========================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    login_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    logout_at TIMESTAMPTZ,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

-- user_sessions 表索引
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);

-- user_sessions 表注释
COMMENT ON TABLE user_sessions IS '用户会话表 - 存储用户登录会话信息';
COMMENT ON COLUMN user_sessions.id IS '会话ID';
COMMENT ON COLUMN user_sessions.user_id IS '关联用户ID';
COMMENT ON COLUMN user_sessions.token IS '会话令牌';
COMMENT ON COLUMN user_sessions.ip_address IS '登录IP地址';
COMMENT ON COLUMN user_sessions.user_agent IS '用户代理信息';
COMMENT ON COLUMN user_sessions.login_at IS '登录时间';
COMMENT ON COLUMN user_sessions.last_activity_at IS '最后活动时间';
COMMENT ON COLUMN user_sessions.logout_at IS '登出时间';
COMMENT ON COLUMN user_sessions.deleted IS '是否软删除';
COMMENT ON COLUMN user_sessions.deleted_at IS '删除时间';

-- ========================================
-- 登录日志表
-- ========================================
CREATE TABLE IF NOT EXISTS login_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('login', 'logout', 'failed_login')),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    result VARCHAR(10) NOT NULL CHECK (result IN ('success', 'failure')),
    error_message TEXT,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

-- login_logs 表索引
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON login_logs(created_at);

-- login_logs 表注释
COMMENT ON TABLE login_logs IS '登录日志表 - 记录用户登录、登出和登录失败的操作日志';
COMMENT ON COLUMN login_logs.id IS '日志ID';
COMMENT ON COLUMN login_logs.user_id IS '关联用户ID（登录失败时可能为NULL）';
COMMENT ON COLUMN login_logs.action IS '操作类型：login(登录), logout(登出), failed_login(登录失败)';
COMMENT ON COLUMN login_logs.ip_address IS '操作IP地址';
COMMENT ON COLUMN login_logs.user_agent IS '用户代理信息';
COMMENT ON COLUMN login_logs.created_at IS '创建时间';
COMMENT ON COLUMN login_logs.result IS '操作结果：success(成功), failure(失败)';
COMMENT ON COLUMN login_logs.error_message IS '错误信息（登录失败时记录）';
COMMENT ON COLUMN login_logs.deleted IS '是否软删除';
COMMENT ON COLUMN login_logs.deleted_at IS '删除时间';

-- ========================================
-- 触发器：自动更新 updated_at
-- ========================================
-- 确保触发器函数存在
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    END IF;
END $$;

-- 创建触发器（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_users_updated_at' 
        AND tgrelid = 'users'::regclass
    ) THEN
        CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
