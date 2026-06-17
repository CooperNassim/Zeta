/**
 * 认证中间件
 * 提供 JWT token 验证、会话验证和角色权限检查功能
 */

const { verifyToken } = require('../utils/jwt');
const { findById, update } = require('../database/queries');
const { pool } = require('../config/database');
const crypto = require('crypto');

/**
 * 认证中间件 - 验证 JWT token、检查会话有效性并加载用户信息
 */
const authenticateToken = async (req, res, next) => {
  try {
    // 从 Authorization header 提取 token
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const token = authHeader.substring(7);

    // 验证 token（指定算法防止 algorithm confusion）
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: '认证令牌已过期' });
      }
      return res.status(401).json({ error: '无效的认证令牌' });
    }

    // 验证会话是否有效（检查是否已登出，并验证 token 哈希）
    if (decoded.sessionId) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const sessionResult = await pool.query(
        'SELECT id FROM user_sessions WHERE id = $1 AND token = $2 AND logout_at IS NULL AND deleted = false',
        [decoded.sessionId, tokenHash]
      );
      if (sessionResult.rows.length === 0) {
        return res.status(401).json({ error: '会话已失效，请重新登录' });
      }
    }

    // 从数据库查询用户信息
    const user = await findById('users', decoded.userId);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    // 检查用户是否已被删除
    if (user.deleted) {
      return res.status(401).json({ error: '用户已被删除' });
    }

    // 检查用户是否处于活跃状态
    if (user.status !== 'active') {
      return res.status(403).json({ error: '用户已被停用' });
    }

    // 将用户信息附加到请求对象
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    // 异步更新会话活动时间（不阻塞请求）
    if (decoded.sessionId) {
      update('user_sessions', decoded.sessionId, {
        last_activity_at: new Date()
      }).catch(err => {
        console.error('更新会话活动时间失败:', err.message);
      });
    }

    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};

/**
 * 角色权限中间件 - 检查用户角色是否在允许列表中
 * @param {...string} allowedRoles - 允许访问的角色列表
 * @returns {Function} 中间件函数
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证，请先登录' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足，无法执行此操作' });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};
