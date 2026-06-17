/**
 * 认证 API 路由
 * 处理用户登录、登出和获取当前用户信息
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { findByUsername, findById, insert, update } = require('../database/queries');
const { authenticateToken } = require('../middleware/auth');
const { generateToken } = require('../utils/jwt');
const { verifyPassword } = require('../utils/password');

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    // 获取客户端信息
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // 查找用户
    const user = await findByUsername(username);
    
    if (!user) {
      // 用户不存在，记录失败日志
      await insert('login_logs', {
        user_id: null,
        action: 'failed_login',
        ip_address: ipAddress,
        user_agent: userAgent,
        result: 'failure',
        error_message: '用户不存在'
      });
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 先检查用户状态再验证密码（防止信息泄露）
    if (user.status !== 'active') {
      await insert('login_logs', {
        user_id: user.id,
        action: 'failed_login',
        ip_address: ipAddress,
        user_agent: userAgent,
        result: 'failure',
        error_message: '用户已被停用'
      });
      return res.status(403).json({ error: '用户名或密码错误' });
    }

    // 验证密码
    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      await insert('login_logs', {
        user_id: user.id,
        action: 'failed_login',
        ip_address: ipAddress,
        user_agent: userAgent,
        result: 'failure',
        error_message: '密码错误'
      });
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 创建会话记录
    const sessionData = {
      user_id: user.id,
      token: '', // 临时占位，后面会更新
      ip_address: ipAddress,
      user_agent: userAgent
    };
    const session = await insert('user_sessions', sessionData);

    // 生成 JWT token（仅包含必要信息）
    const tokenPayload = {
      userId: user.id,
      role: user.role,
      sessionId: session.id
    };
    const token = generateToken(tokenPayload);

    // 更新会话记录的 token（存储哈希值而非明文）
    await update('user_sessions', session.id, { token: crypto.createHash('sha256').update(token).digest('hex') });

    // 记录登录成功日志
    await insert('login_logs', {
      user_id: user.id,
      action: 'login',
      ip_address: ipAddress,
      user_agent: userAgent,
      result: 'success'
    });

    // 返回 token 和用户信息
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/auth/logout
 * 用户登出
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // 从 Authorization header 提取 token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // 获取客户端信息
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // 从 token 中获取 sessionId（需要解码 token）
    const { verifyToken } = require('../utils/jwt');
    const decoded = verifyToken(token);
    const sessionId = decoded.sessionId;

    // 更新会话的 logout_at 字段
    if (sessionId) {
      await update('user_sessions', sessionId, {
        logout_at: new Date()
      });
    }

    // 记录登出日志
    await insert('login_logs', {
      user_id: req.user.id,
      action: 'logout',
      ip_address: ipAddress,
      user_agent: userAgent,
      result: 'success'
    });

    res.json({ message: '登出成功' });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // 从数据库获取最新用户信息
    const user = await findById('users', req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
