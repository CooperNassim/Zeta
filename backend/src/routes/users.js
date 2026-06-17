/**
 * 用户管理 API 路由
 * 提供用户账号的增删改查功能
 * 所有路由都需要管理员权限
 */

const express = require('express');
const router = express.Router();
const { findAll, findById, insert, update, remove, findByUsername } = require('../database/queries');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { hashPassword } = require('../utils/password');
const { pool } = require('../config/database');

// 所有路由都需要认证和管理员权限
router.use(authenticateToken);
router.use(requireRole('admin'));

// 密码强度验证
const validatePassword = (password) => {
  if (password.length < 6) {
    return '密码长度不能少于 6 位';
  }
  if (password.length > 50) {
    return '密码长度不能超过 50 位';
  }
  return null;
};

// 角色白名单
const VALID_ROLES = ['admin', 'trader', 'viewer'];

/**
 * GET /api/users
 * 获取所有用户列表
 */
router.get('/', async (req, res) => {
  try {
    const users = await findAll('users');
    
    // 移除密码哈希字段
    const usersWithoutPassword = users.map(user => {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(usersWithoutPassword);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/users/:id
 * 获取单个用户详情
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await findById('users', userId);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 移除密码哈希字段
    const { password_hash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/users
 * 创建新用户
 */
router.post('/', async (req, res) => {
  try {
    const { username, password, role, status } = req.body;
    
    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    // 密码强度验证
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    // 角色白名单验证
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `无效的角色，可选值: ${VALID_ROLES.join(', ')}` });
    }
    
    // 检查用户名是否已存在
    const existingUser = await findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    
    // 加密密码
    const password_hash = await hashPassword(password);
    
    // 创建用户（直接使用 SQL，避免通用 insert 过滤受保护字段）
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role, status) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, username, role, status, created_at, updated_at`,
      [username, password_hash, role || 'viewer', status || 'active']
    );
    
    const newUser = result.rows[0];
    
    res.status(201).json(newUser);
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * PUT /api/users/:id
 * 更新用户信息
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, role, status } = req.body;
    
    // 检查用户是否存在
    const existingUser = await findById('users', userId);
    if (!existingUser) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 如果修改了用户名，检查新用户名是否已被使用
    if (username && username !== existingUser.username) {
      const userWithSameUsername = await findByUsername(username);
      if (userWithSameUsername) {
        return res.status(400).json({ error: '用户名已存在' });
      }
    }
    
    // 准备更新数据
    const updateData = {};
    if (username) updateData.username = username;
    if (role) {
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: `无效的角色，可选值: ${VALID_ROLES.join(', ')}` });
      }
      updateData.role = role;
    }
    if (status) updateData.status = status;
    
    // 更新用户
    const updatedUser = await update('users', userId, updateData);
    
    // 移除密码哈希字段
    const { password_hash, ...userWithoutPassword } = updatedUser;
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * DELETE /api/users/:id
 * 删除用户（软删除）
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // 不能删除自己
    if (userId === req.user.id) {
      return res.status(400).json({ error: '不能删除当前登录的用户' });
    }
    
    // 检查用户是否存在
    const existingUser = await findById('users', userId);
    if (!existingUser) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 不能删除最后一个管理员
    if (existingUser.role === 'admin') {
      const adminCount = await pool.query(
        "SELECT COUNT(*) FROM users WHERE role = 'admin' AND deleted = false"
      );
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ error: '不能删除最后一个管理员账号' });
      }
    }
    
    // 软删除用户
    await remove('users', userId);
    
    res.json({ message: '用户已删除' });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * PUT /api/users/:id/password
 * 重置用户密码
 */
router.put('/:id/password', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { password } = req.body;
    
    // 验证密码
    if (!password) {
      return res.status(400).json({ error: '密码不能为空' });
    }

    // 密码强度验证
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }
    
    // 检查用户是否存在
    const existingUser = await findById('users', userId);
    if (!existingUser) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 加密新密码
    const password_hash = await hashPassword(password);
    
    // 更新密码
    await update('users', userId, { password_hash });
    
    res.json({ message: '密码已重置' });
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/users/:id/sessions
 * 获取用户会话记录
 */
router.get('/:id/sessions', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // 检查用户是否存在
    const existingUser = await findById('users', userId);
    if (!existingUser) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 查询会话记录（不返回完整 token，只返回 token 前 20 位用于识别）
    const result = await pool.query(
      `SELECT id, user_id, LEFT(token, 20) as token_preview, ip_address, user_agent, 
              login_at, last_activity_at, logout_at, created_at
       FROM user_sessions 
       WHERE user_id = $1 AND deleted = false
       ORDER BY login_at DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('获取会话记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/users/:id/login-logs
 * 获取用户登录日志
 */
router.get('/:id/login-logs', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // 检查用户是否存在
    const existingUser = await findById('users', userId);
    if (!existingUser) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 查询登录日志
    const result = await pool.query(
      `SELECT id, user_id, action, ip_address, user_agent, 
              created_at, result, error_message
       FROM login_logs 
       WHERE user_id = $1 AND deleted = false
       ORDER BY created_at DESC
       LIMIT 100`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('获取登录日志错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
