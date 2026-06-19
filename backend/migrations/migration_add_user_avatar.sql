-- ========================================
-- 用户表添加头像字段
-- 用途：存储用户头像文件路径
-- ========================================

-- 添加 avatar 字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);

-- 字段注释
COMMENT ON COLUMN users.avatar IS '用户头像文件路径（相对于 uploads 目录）';
