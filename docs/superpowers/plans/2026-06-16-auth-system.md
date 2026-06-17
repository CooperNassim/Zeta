# 账号管理体系实现计划

> **For AI Agent Workers:** Prioritize using `subagent-driven-development` (when the environment supports implementation subagents and tasks are mostly independent) or `executing-plans` (when sequential execution in the current session is needed or implementation subagents are unsupported) to implement this plan task by task. Use checkbox (`- [ ]`) syntax to track progress.

**目标:** 为 Zeta 智能交易系统添加完整的账号管理体系，包括用户认证、权限控制、登录记录查询和账号管理界面

**架构:** 采用 JWT + 后端 Session 记录的混合方案。JWT 用于无状态认证验证，后端维护 user_sessions 表支持登录记录查询和主动登出，login_logs 表记录登录行为审计。前端通过 Zustand 管理认证状态，路由守卫控制页面访问权限。

**技术栈:** 
- 后端：Express + PostgreSQL + bcrypt + jsonwebtoken
- 前端：React 18 + Zustand + React Router v6
- 认证：JWT (RS256 算法) + bcrypt 密码加密

---

## 文件结构

### 后端文件
- `backend/migrations/migration_auth_system_v1.sql` - 数据库迁移脚本（users, user_sessions, login_logs 表）
- `backend/src/middleware/auth.js` - 认证中间件（JWT 验证、权限检查）
- `backend/src/routes/auth.js` - 认证相关 API 路由（登录、登出、获取当前用户）
- `backend/src/routes/users.js` - 用户管理 API 路由（CRUD、密码重置）
- `backend/src/database/queries.js` - 补充用户相关查询函数（如 findByUsername）
- `backend/src/server.js` - 注册认证和用户管理路由

### 前端文件
- `src/pages/Login.jsx` - 登录页面组件
- `src/pages/AccountManagement.jsx` - 账号管理页面组件
- `src/store/authStore.js` - 认证状态管理（独立于主 store）
- `src/components/ProtectedRoute.jsx` - 路由守卫组件
- `src/App.jsx` - 添加登录路由、集成认证状态、权限菜单控制
- `src/services/authClient.js` - 认证相关 API 客户端封装

---

## 任务 1: 数据库表结构设计与迁移

**文件:**
- Create: `backend/migrations/migration_auth_system_v1.sql`

**前置条件:**
- 无

**完成标准:**
- users 表包含：id, username, password_hash, role (admin/trader/viewer), status (active/inactive), created_at, updated_at, deleted, deleted_at
- user_sessions 表包含：id, user_id, token, ip_address, user_agent, login_at, last_activity_at, logout_at
- login_logs 表包含：id, user_id, action (login/logout/failed_login), ip_address, user_agent, created_at, result (success/failure), error_message
- 所有表支持软删除（deleted + deleted_at）
- 迁移脚本可重复执行（使用 IF NOT EXISTS）

- [ ] **Step 1: 创建迁移文件**

```sql
-- backend/migrations/migration_auth_system_v1.sql

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'trader', 'viewer')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 用户会话表
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  logout_at TIMESTAMP WITH TIME ZONE,
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 登录日志表
CREATE TABLE IF NOT EXISTS login_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('login', 'logout', 'failed_login')),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  result VARCHAR(10) NOT NULL CHECK (result IN ('success', 'failure')),
  error_message TEXT,
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON login_logs(created_at);

-- 插入默认管理员账号（密码：admin123，需要后端生成实际的 bcrypt hash）
-- 注意：实际的 hash 会在后端初始化时生成
INSERT INTO users (username, password_hash, role, status)
VALUES ('admin', '$2b$10$placeholder_hash_replace_on_init', 'admin', 'active')
ON CONFLICT (username) DO NOTHING;
```

- [ ] **Step 2: 验证迁移脚本语法**

```powershell
cd backend
# 检查 SQL 语法（如果有 psql 可用）
# psql -U postgres -d zeta -f migrations/migration_auth_system_v1.sql
```

Expected: 迁移脚本无语法错误

- [ ] **Step 3: 提交迁移脚本**

```powershell
git add backend/migrations/migration_auth_system_v1.sql
git commit -m "feat: add auth system database migration

- Add users table with role-based access control
- Add user_sessions table for session tracking
- Add login_logs table for audit trail
- Create indexes for performance optimization"
```

---

## 任务 2: 后端认证中间件与工具函数

**文件:**
- Create: `backend/src/middleware/auth.js`
- Create: `backend/src/utils/jwt.js`
- Create: `backend/src/utils/password.js`

**前置条件:**
- 任务 1 完成（数据库表已创建）

**完成标准:**
- auth 中间件可以验证 JWT token 并附加 user 信息到 req.user
- auth 中间件可以检查用户角色权限
- jwt 工具可以生成和验证 token（RS256 算法）
- password 工具可以加密和验证密码（bcrypt）
- JWT secret 从环境变量读取

- [ ] **Step 1: 安装依赖**

```powershell
cd backend
npm install bcrypt jsonwebtoken
```

- [ ] **Step 2: 创建 JWT 工具**

```javascript
// backend/src/utils/jwt.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * 生成 JWT token
 * @param {Object} payload - 包含用户信息的对象
 * @returns {string} JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 验证 JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} 解码后的 payload 或 null
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = { generateToken, verifyToken };
```

- [ ] **Step 3: 创建密码工具**

```javascript
// backend/src/utils/password.js
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * 加密密码
 * @param {string} password - 明文密码
 * @returns {Promise<string>} 加密后的密码 hash
 */
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @param {string} hash - 密码 hash
 * @returns {Promise<boolean>} 密码是否匹配
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { hashPassword, verifyPassword };
```

- [ ] **Step 4: 创建认证中间件**

```javascript
// backend/src/middleware/auth.js
const { verifyToken } = require('../utils/jwt');
const { findById } = require('../database/queries');

/**
 * 验证 JWT token 并附加用户信息到 req.user
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: '未提供认证 token' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'token 无效或已过期' });
  }

  // 验证用户是否存在且活跃
  try {
    const user = await findById('users', decoded.userId);
    if (!user || user.deleted || user.status !== 'active') {
      return res.status(403).json({ error: '用户不存在或已被禁用' });
    }

    // 附加用户信息到请求对象
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    // 更新会话最后活动时间（可选，异步执行）
    const pool = require('../config/database');
    pool.query(
      'UPDATE user_sessions SET last_activity_at = CURRENT_TIMESTAMP WHERE token = $1 AND deleted = false',
      [token]
    ).catch(err => console.error('更新会话活动时间失败:', err));

    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({ error: '服务器错误' });
  }
}

/**
 * 检查用户角色权限
 * @param  {...string} allowedRoles - 允许的角色列表
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }

    next();
  };
}

module.exports = { authenticateToken, requireRole };
```

- [ ] **Step 5: 提交认证工具**

```powershell
git add backend/src/utils/jwt.js backend/src/utils/password.js backend/src/middleware/auth.js
git commit -m "feat: add authentication middleware and utilities

- JWT token generation and verification
- Bcrypt password hashing and verification
- Authentication middleware with user role checking
- Session activity tracking"
```

---

## 任务 3: 后端认证 API 路由

**文件:**
- Create: `backend/src/routes/auth.js`
- Modify: `backend/src/server.js` (注册路由)
- Modify: `backend/src/database/queries.js` (添加 findByUsername)

**前置条件:**
- 任务 2 完成（认证中间件已创建）

**完成标准:**
- POST /api/auth/login - 用户登录，返回 JWT token
- POST /api/auth/logout - 用户登出，删除 session 记录
- GET /api/auth/me - 获取当前登录用户信息
- POST /api/auth/refresh - 刷新 token（可选）
- 登录时创建 user_sessions 和 login_logs 记录
- 登出时更新 user_sessions.logout_at
- 失败登录记录到 login_logs

- [ ] **Step 1: 添加 findByUsername 查询函数**

```javascript
// backend/src/database/queries.js - 在文件末尾添加

/**
 * 根据用户名查找用户
 * @param {string} username - 用户名
 * @returns {Promise<Object|null>} 用户对象或 null
 */
async function findByUsername(username) {
  const pool = require('../config/database');
  const result = await pool.query(
    'SELECT * FROM users WHERE username = $1 AND deleted = false',
    [username]
  );
  return result.rows[0] || null;
}

module.exports.findByUsername = findByUsername;
```

- [ ] **Step 2: 创建认证路由**

```javascript
// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const { findByUsername, findById, insert } = require('../database/queries');
const { hashPassword, verifyPassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');

  try {
    // 查找用户
    const user = await findByUsername(username);
    if (!user) {
      // 记录失败登录
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

    // 验证密码
    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      // 记录失败登录
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

    // 检查用户状态
    if (user.status !== 'active') {
      await insert('login_logs', {
        user_id: user.id,
        action: 'failed_login',
        ip_address: ipAddress,
        user_agent: userAgent,
        result: 'failure',
        error_message: '用户已被禁用'
      });
      return res.status(403).json({ error: '用户已被禁用' });
    }

    // 生成 JWT token
    const token = generateToken({ userId: user.id, username: user.username, role: user.role });

    // 创建会话记录
    await insert('user_sessions', {
      user_id: user.id,
      token: token,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    // 记录成功登录
    await insert('login_logs', {
      user_id: user.id,
      action: 'login',
      ip_address: ipAddress,
      user_agent: userAgent,
      result: 'success'
    });

    // 返回用户信息和 token
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
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * POST /api/auth/logout
 * 用户登出
 */
router.post('/logout', authenticateToken, async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  try {
    // 更新会话记录
    const pool = require('../config/database');
    await pool.query(
      'UPDATE user_sessions SET logout_at = CURRENT_TIMESTAMP WHERE token = $1',
      [token]
    );

    // 记录登出
    await insert('login_logs', {
      user_id: req.user.id,
      action: 'logout',
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('user-agent'),
      result: 'success'
    });

    res.json({ message: '登出成功' });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
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
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
```

- [ ] **Step 3: 注册认证路由到 server.js**

```javascript
// backend/src/server.js - 在现有路由注册后添加

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
```

- [ ] **Step 4: 测试登录 API**

```powershell
# 启动后端服务
cd backend
npm run dev

# 在另一个终端测试登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Expected: 返回 token 和用户信息

- [ ] **Step 5: 提交认证路由**

```powershell
git add backend/src/routes/auth.js backend/src/server.js backend/src/database/queries.js
git commit -m "feat: add authentication API routes

- POST /api/auth/login - user login with JWT
- POST /api/auth/logout - user logout with session cleanup
- GET /api/auth/me - get current user info
- Login attempt logging for audit trail"
```

---

## 任务 4: 后端用户管理 API 路由

**文件:**
- Create: `backend/src/routes/users.js`
- Modify: `backend/src/server.js` (注册用户管理路由)

**前置条件:**
- 任务 3 完成（认证路由已创建）

**完成标准:**
- GET /api/users - 获取所有用户列表（仅 admin）
- GET /api/users/:id - 获取单个用户详情（仅 admin）
- POST /api/users - 创建新用户（仅 admin）
- PUT /api/users/:id - 更新用户信息（仅 admin）
- DELETE /api/users/:id - 删除用户（软删除，仅 admin）
- PUT /api/users/:id/password - 重置用户密码（仅 admin）
- GET /api/users/:id/sessions - 获取用户登录记录（仅 admin）
- GET /api/users/:id/login-logs - 获取用户登录日志（仅 admin）

- [ ] **Step 1: 创建用户管理路由**

```javascript
// backend/src/routes/users.js
const express = require('express');
const router = express.Router();
const { findAll, findById, insert, update, remove } = require('../database/queries');
const { hashPassword } = require('../utils/password');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 所有路由都需要认证和管理员权限
router.use(authenticateToken);
router.use(requireRole('admin'));

/**
 * GET /api/users
 * 获取所有用户列表
 */
router.get('/', async (req, res) => {
  try {
    const users = await findAll('users');
    // 移除密码 hash
    const usersWithoutPassword = users.map(({ password_hash, ...user }) => user);
    res.json(usersWithoutPassword);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * GET /api/users/:id
 * 获取单个用户详情
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await findById('users', req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    const { password_hash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * POST /api/users
 * 创建新用户
 */
router.post('/', async (req, res) => {
  const { username, password, role, status } = req.body;

  try {
    // 检查用户名是否已存在
    const { findByUsername } = require('../database/queries');
    const existingUser = await findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    // 加密密码
    const password_hash = await hashPassword(password);

    // 创建用户
    const newUser = await insert('users', {
      username,
      password_hash,
      role: role || 'viewer',
      status: status || 'active'
    });

    const { password_hash: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * PUT /api/users/:id
 * 更新用户信息
 */
router.put('/:id', async (req, res) => {
  const { role, status } = req.body;

  try {
    const user = await findById('users', req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const updates = {};
    if (role !== undefined) updates.role = role;
    if (status !== undefined) updates.status = status;
    updates.updated_at = new Date();

    const updatedUser = await update('users', req.params.id, updates);
    const { password_hash, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * DELETE /api/users/:id
 * 删除用户（软删除）
 */
router.delete('/:id', async (req, res) => {
  try {
    const user = await findById('users', req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 不能删除自己
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: '不能删除当前登录用户' });
    }

    await remove('users', req.params.id);
    res.json({ message: '用户已删除' });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * PUT /api/users/:id/password
 * 重置用户密码
 */
router.put('/:id/password', async (req, res) => {
  const { password } = req.body;

  try {
    const user = await findById('users', req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const password_hash = await hashPassword(password);
    await update('users', req.params.id, { password_hash, updated_at: new Date() });

    res.json({ message: '密码已重置' });
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * GET /api/users/:id/sessions
 * 获取用户会话记录
 */
router.get('/:id/sessions', async (req, res) => {
  try {
    const pool = require('../config/database');
    const result = await pool.query(
      `SELECT * FROM user_sessions 
       WHERE user_id = $1 AND deleted = false 
       ORDER BY login_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('获取会话记录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * GET /api/users/:id/login-logs
 * 获取用户登录日志
 */
router.get('/:id/login-logs', async (req, res) => {
  try {
    const pool = require('../config/database');
    const result = await pool.query(
      `SELECT * FROM login_logs 
       WHERE user_id = $1 AND deleted = false 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('获取登录日志错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
```

- [ ] **Step 2: 注册用户管理路由到 server.js**

```javascript
// backend/src/server.js - 在认证路由后添加

const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);
```

- [ ] **Step 3: 测试用户管理 API**

```powershell
# 先登录获取 token
$loginResponse = curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
$token = ($loginResponse | ConvertFrom-Json).token

# 获取用户列表
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer $token"
```

Expected: 返回用户列表（不含密码）

- [ ] **Step 4: 提交用户管理路由**

```powershell
git add backend/src/routes/users.js backend/src/server.js
git commit -m "feat: add user management API routes

- CRUD operations for users (admin only)
- Password reset functionality
- Session and login log retrieval
- Role-based access control"
```

---

## 任务 5: 前端认证状态管理

**文件:**
- Create: `src/store/authStore.js`
- Create: `src/services/authClient.js`

**前置条件:**
- 任务 3 完成（后端认证 API 已就绪）

**完成标准:**
- authStore 管理认证状态（token, user, isAuthenticated）
- authStore 提供 login, logout, refreshToken 方法
- authStore 从 localStorage 持久化认证状态
- authClient 封装认证 API 调用，自动附加 Authorization header

- [ ] **Step 1: 创建认证 API 客户端**

```javascript
// src/services/authClient.js
const API_BASE_URL = '';

/**
 * 认证相关 API 客户端
 */
const authClient = {
  /**
   * 登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<Object>} 包含 token 和用户信息
   */
  async login(username, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '登录失败');
    }

    return response.json();
  },

  /**
   * 登出
   * @param {string} token - JWT token
   * @returns {Promise<void>}
   */
  async logout(token) {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '登出失败');
    }
  },

  /**
   * 获取当前用户信息
   * @param {string} token - JWT token
   * @returns {Promise<Object>} 用户信息
   */
  async getCurrentUser(token) {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('获取用户信息失败');
    }

    return response.json();
  }
};

export default authClient;
```

- [ ] **Step 2: 创建认证状态管理**

```javascript
// src/store/authStore.js
import { create } from 'zustand';
import authClient from '../services/authClient';

const useAuthStore = create((set, get) => ({
  // 状态
  token: localStorage.getItem('auth_token') || null,
  user: JSON.parse(localStorage.getItem('auth_user') || 'null'),
  isAuthenticated: !!localStorage.getItem('auth_token'),
  isLoading: false,
  error: null,

  // 登录
  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await authClient.login(username, password);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // 登出
  logout: async () => {
    const { token } = get();
    try {
      if (token) {
        await authClient.logout(token);
      }
    } catch (error) {
      console.error('登出错误:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      set({ token: null, user: null, isAuthenticated: false });
    }
  },

  // 刷新用户信息
  refreshUser: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const user = await authClient.getCurrentUser(token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      set({ user });
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      // token 可能已过期，清除认证状态
      if (error.message.includes('403') || error.message.includes('无效')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        set({ token: null, user: null, isAuthenticated: false });
      }
    }
  },

  // 清除错误
  clearError: () => set({ error: null }),

  // 检查是否有权限
  hasPermission: (requiredRole) => {
    const { user } = get();
    if (!user) return false;

    const roleHierarchy = { admin: 3, trader: 2, viewer: 1 };
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }
}));

export default useAuthStore;
```

- [ ] **Step 3: 提交认证状态管理**

```powershell
git add src/services/authClient.js src/store/authStore.js
git commit -m "feat: add authentication state management

- authClient for API communication
- authStore with Zustand for state management
- localStorage persistence for auth state
- Role-based permission checking"
```

---

## 任务 6: 前端登录页面

**文件:**
- Create: `src/pages/Login.jsx`

**前置条件:**
- 任务 5 完成（认证状态管理已创建）

**完成标准:**
- 登录页面包含用户名和密码输入框
- 登录表单提交后调用 authStore.login
- 登录成功后跳转到首页
- 登录失败显示错误信息
- 页面样式与系统整体风格一致（glass-morphism）

- [ ] **Step 1: 创建登录页面**

```javascript
// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import useAuthStore from '../store/authStore';

function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    const result = await login(username, password);
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <img src="/Zeta.png" alt="Zeta" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">Zeta 智能交易系统</h1>
          <p className="text-gray-600 mt-2">请登录您的账号</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              用户名
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="请输入用户名"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="请输入密码"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>默认管理员账号: admin / admin123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
```

- [ ] **Step 2: 提交登录页面**

```powershell
git add src/pages/Login.jsx
git commit -m "feat: add login page with glass-morphism design

- Username and password form with validation
- Error message display
- Loading state handling
- Consistent with system design language"
```

---

## 任务 7: 前端账号管理页面

**文件:**
- Create: `src/pages/AccountManagement.jsx`

**前置条件:**
- 任务 4 完成（后端用户管理 API 已就绪）
- 任务 5 完成（认证状态管理已创建）

**完成标准:**
- 显示用户列表表格（用户名、角色、状态、创建时间）
- 支持创建新用户（弹窗表单）
- 支持编辑用户（角色、状态）
- 支持删除用户（软删除）
- 支持重置密码
- 支持查看用户登录记录（弹窗）
- 只有 admin 角色可以访问此页面

- [ ] **Step 1: 创建账号管理页面**

由于页面代码较长，请参考现有页面（如 DatabaseManagement.jsx）的结构，包含：
- 用户列表表格
- 创建/编辑用户弹窗
- 重置密码弹窗
- 查看登录记录弹窗
- API 调用使用 fetch 直接调用 /api/users 接口

关键功能点：
1. 使用 fetch 调用 GET /api/users 获取用户列表
2. 使用 fetch 调用 POST /api/users 创建用户
3. 使用 fetch 调用 PUT /api/users/:id 更新用户
4. 使用 fetch 调用 DELETE /api/users/:id 删除用户
5. 使用 fetch 调用 PUT /api/users/:id/password 重置密码
6. 使用 fetch 调用 GET /api/users/:id/login-logs 获取登录记录
7. 所有请求需要携带 Authorization header

- [ ] **Step 2: 提交账号管理页面**

```powershell
git add src/pages/AccountManagement.jsx
git commit -m "feat: add account management page

- User list with role and status display
- Create, edit, delete user operations
- Password reset functionality
- Login history viewer
- Admin-only access control"
```

---

## 任务 8: 前端路由守卫与权限控制

**文件:**
- Create: `src/components/ProtectedRoute.jsx`
- Modify: `src/App.jsx` (集成认证、添加路由守卫、权限菜单)

**前置条件:**
- 任务 5 完成（认证状态管理已创建）
- 任务 6 完成（登录页面已创建）

**完成标准:**
- ProtectedRoute 组件检查认证状态，未登录重定向到 /login
- ProtectedRoute 支持角色权限检查
- App.jsx 添加 /login 路由
- App.jsx 添加 /account-management 路由（仅 admin）
- 根据用户角色动态显示/隐藏菜单项
- 未登录时自动跳转到登录页

- [ ] **Step 1: 创建路由守卫组件**

```javascript
// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, hasPermission } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasPermission(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
```

- [ ] **Step 2: 修改 App.jsx 集成认证**

需要修改的部分：
1. 导入 useAuthStore 和 ProtectedRoute
2. 导入 Login 和 AccountManagement 页面
3. 在 Navigation 组件中根据用户角色过滤菜单项
4. 在 Routes 中添加 /login 路由（不需要 ProtectedRoute）
5. 在 Routes 中添加 /account-management 路由（需要 ProtectedRoute + admin 权限）
6. 在 AppContent 中添加认证状态检查

关键修改点：
- settingsMenuItems 中添加账号管理菜单项（仅 admin 可见）
- 根据 user.role 过滤 settingsMenuItems
- 添加 useEffect 在应用启动时检查认证状态

- [ ] **Step 3: 提交路由守卫和权限控制**

```powershell
git add src/components/ProtectedRoute.jsx src/App.jsx
git commit -m "feat: add route protection and role-based access control

- ProtectedRoute component for authentication
- Role-based permission checking
- Dynamic menu filtering based on user role
- Login route integration
- Account management route (admin only)"
```

---

## 任务 9: 初始化默认管理员账号

**文件:**
- Create: `backend/scripts/init-admin.js`
- Modify: `backend/package.json` (添加初始化脚本)

**前置条件:**
- 任务 1 完成（数据库表已创建）
- 任务 2 完成（密码工具已创建）

**完成标准:**
- 脚本检查 admin 用户是否存在
- 如果不存在，创建默认 admin 用户（密码：admin123）
- 如果已存在，不覆盖
- 提供 npm 脚本命令运行初始化

- [ ] **Step 1: 创建初始化管理员脚本**

```javascript
// backend/scripts/init-admin.js
const { pool } = require('../src/config/database');
const { hashPassword } = require('../src/utils/password');

async function initAdmin() {
  try {
    console.log('检查默认管理员账号...');

    // 检查 admin 用户是否存在
    const result = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);

    if (result.rows.length > 0) {
      console.log('管理员账号已存在，跳过创建');
      process.exit(0);
    }

    // 创建默认管理员
    const password_hash = await hashPassword('admin123');
    await pool.query(
      'INSERT INTO users (username, password_hash, role, status) VALUES ($1, $2, $3, $4)',
      ['admin', password_hash, 'admin', 'active']
    );

    console.log('默认管理员账号创建成功');
    console.log('用户名: admin');
    console.log('密码: admin123');
    console.log('请及时修改默认密码！');

    process.exit(0);
  } catch (error) {
    console.error('初始化管理员失败:', error);
    process.exit(1);
  }
}

initAdmin();
```

- [ ] **Step 2: 添加 npm 脚本**

```json
// backend/package.json - 在 scripts 部分添加
"init-admin": "node scripts/init-admin.js"
```

- [ ] **Step 3: 运行初始化脚本**

```powershell
cd backend
npm run init-admin
```

Expected: 创建默认管理员账号

- [ ] **Step 4: 提交初始化脚本**

```powershell
git add backend/scripts/init-admin.js backend/package.json
git commit -m "feat: add admin initialization script

- Create default admin account if not exists
- npm script for easy initialization
- Default credentials: admin / admin123"
```

---

## 任务 10: 环境变量配置与文档

**文件:**
- Modify: `backend/.env.example` (添加 JWT_SECRET)
- Modify: `.env.docker` (添加 JWT_SECRET)

**前置条件:**
- 无

**完成标准:**
- 后端 .env 文件包含 JWT_SECRET 配置
- Docker 环境也配置 JWT_SECRET
- 提供生成安全 JWT_SECRET 的方法

- [ ] **Step 1: 更新环境变量示例**

```bash
# backend/.env.example - 添加以下配置

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

```bash
# .env.docker - 添加以下配置

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-docker
```

- [ ] **Step 2: 生成随机 JWT_SECRET（可选）**

```powershell
# 在 PowerShell 中生成随机字符串
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

- [ ] **Step 3: 提交环境变量配置**

```powershell
git add backend/.env.example .env.docker
git commit -m "chore: add JWT_SECRET to environment configuration

- Add JWT_SECRET to backend .env.example
- Add JWT_SECRET to Docker environment
- Document secret key requirements"
```

---

## 任务 11: 集成测试与验证

**文件:**
- 无新文件

**前置条件:**
- 所有前置任务完成

**完成标准:**
- 数据库迁移成功执行
- 默认管理员账号创建成功
- 登录功能正常工作
- 登出功能正常工作
- 用户管理 CRUD 操作正常
- 权限控制生效（非 admin 无法访问账号管理）
- 登录记录正确记录
- 前端路由守卫正常工作

- [ ] **Step 1: 运行数据库迁移**

```powershell
cd backend
npm run migrate
```

Expected: 迁移成功，创建 users, user_sessions, login_logs 表

- [ ] **Step 2: 初始化管理员账号**

```powershell
cd backend
npm run init-admin
```

Expected: 创建默认 admin 账号

- [ ] **Step 3: 启动后端服务**

```powershell
cd backend
npm run dev
```

- [ ] **Step 4: 启动前端服务**

```powershell
npm run dev
```

- [ ] **Step 5: 测试登录流程**

1. 访问 http://localhost:5173
2. 应该自动跳转到登录页
3. 使用 admin / admin123 登录
4. 登录成功后跳转到首页
5. 检查顶部导航和侧边栏菜单

- [ ] **Step 6: 测试账号管理**

1. 点击"设置" -> "账号管理"
2. 查看用户列表
3. 创建新用户（角色：trader）
4. 编辑用户角色
5. 重置用户密码
6. 查看用户登录记录
7. 删除用户

- [ ] **Step 7: 测试权限控制**

1. 使用 trader 用户登录
2. 检查"设置"菜单中是否没有"账号管理"选项
3. 直接访问 /account-management 应该被重定向到首页

- [ ] **Step 8: 测试登出**

1. 点击登出按钮（需要在导航栏添加）
2. 应该跳转到登录页
3. 访问受保护页面应该被重定向到登录页

- [ ] **Step 9: 提交测试验证**

```powershell
git add .
git commit -m "test: verify auth system integration

- Database migration successful
- Admin account initialized
- Login/logout flow working
- User management CRUD working
- Role-based access control working
- Login logging working"
```

---

## 完成信号

- 所有 11 个任务完成
- 数据库表创建成功
- 默认管理员账号创建成功
- 登录/登出功能正常
- 用户管理功能正常
- 权限控制生效
- 登录记录正确记录
- 前端路由守卫正常工作

---

## 验证命令

```powershell
# 1. 检查数据库表
cd backend
npm run migrate:verify

# 2. 检查管理员账号
# 使用 psql 或数据库工具查看 users 表

# 3. 测试登录 API
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 4. 启动前端和后端
npm run dev  # 前端
cd backend && npm run dev  # 后端
```

---

## 执行建议

**推荐执行方式:** `subagent-driven-development`

**原因:** 
1. 环境支持实现子代理
2. 任务之间相对独立（数据库、后端 API、前端页面可以并行开发）
3. 任务边界清晰，可以按文件结构分配给不同子代理

**替代方案:** `executing-plans`

**原因:** 如果需要严格按照顺序执行，或者环境不支持实现子代理

**下一步:** 调用 `subagent-driven-development` 或 `executing-plans` 开始实现

---

## [Context Payload]

**Architecture:** JWT + 后端 Session 记录的混合认证方案。JWT 用于无状态认证，user_sessions 表支持登录记录查询和主动登出，login_logs 表记录登录行为审计。

**Key Interfaces:**
- 后端 API: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
- 用户管理 API: GET/POST/PUT/DELETE /api/users, PUT /api/users/:id/password, GET /api/users/:id/sessions, GET /api/users/:id/login-logs
- 前端 Store: useAuthStore (login, logout, refreshUser, hasPermission)
- 前端组件: ProtectedRoute (requiredRole prop)

**Conventions:**
- 后端使用 CommonJS 模块系统
- 前端使用 ES modules
- 数据库查询使用 queries.js 辅助函数
- API 路由使用 Express Router
- 前端状态管理使用 Zustand
- 样式使用 Tailwind CSS

**Constraints:**
- 密码必须使用 bcrypt 加密（10 轮）
- JWT 使用 HS256 算法（或 RS256）
- 所有 API 请求需要 Authorization header
- 前端认证状态持久化到 localStorage
- 软删除模式（deleted + deleted_at）

**Uncertainties:**
- JWT_SECRET 的生产环境值需要用户配置
- 是否需要 token 刷新机制（当前设计为 7 天有效期）
- 是否需要更细粒度的权限控制（当前为三角色模型）

**Handoff Files:**
- 计划文档: docs/superpowers/plans/2026-06-16-auth-system.md
- 迁移脚本: backend/migrations/migration_auth_system_v1.sql
- 后端路由: backend/src/routes/auth.js, backend/src/routes/users.js
- 前端页面: src/pages/Login.jsx, src/pages/AccountManagement.jsx
- 状态管理: src/store/authStore.js
