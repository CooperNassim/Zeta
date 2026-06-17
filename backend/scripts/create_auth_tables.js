const { pool } = require('../src/config/database');
const { hashPassword } = require('../src/utils/password');

async function createAuthTables() {
  try {
    console.log('创建认证系统表...');

    // 创建用户表
    await pool.query(`
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
      )
    `);
    console.log('✓ users 表创建成功');

    // 创建索引
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    console.log('✓ 索引创建成功');

    // 创建用户会话表
    await pool.query(`
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
      )
    `);
    console.log('✓ user_sessions 表创建成功');

    // 创建会话索引
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token)`);

    // 创建登录日志表
    await pool.query(`
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
      )
    `);
    console.log('✓ login_logs 表创建成功');

    // 创建日志索引
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON login_logs(created_at)`);

    // 创建触发器（如果函数存在）
    const funcCheck = await pool.query(`SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'`);
    if (funcCheck.rows.length > 0) {
      const triggerCheck = await pool.query(`
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_users_updated_at' 
        AND tgrelid = 'users'::regclass
      `);
      if (triggerCheck.rows.length === 0) {
        await pool.query(`
          CREATE TRIGGER update_users_updated_at 
          BEFORE UPDATE ON users 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column()
        `);
        console.log('✓ 触发器创建成功');
      }
    }

    console.log('\n✅ 所有表创建完成！');

    // 创建默认管理员
    console.log('\n检查默认管理员账号...');
    const adminCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);

    if (adminCheck.rows.length > 0) {
      console.log('管理员账号已存在，跳过创建');
    } else {
      const password_hash = await hashPassword('admin123');
      await pool.query(
        'INSERT INTO users (username, password_hash, role, status) VALUES ($1, $2, $3, $4)',
        ['admin', password_hash, 'admin', 'active']
      );
      console.log('\n✅ 默认管理员账号创建成功！');
      console.log('用户名: admin');
      console.log('密码: admin123');
      console.log('请及时修改默认密码！');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 创建表失败:', error);
    process.exit(1);
  }
}

createAuthTables();
