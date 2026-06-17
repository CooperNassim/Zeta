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
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123'
    const password_hash = await hashPassword(defaultPassword);
    await pool.query(
      'INSERT INTO users (username, password_hash, role, status) VALUES ($1, $2, $3, $4)',
      ['admin', password_hash, 'admin', 'active']
    );

    console.log('默认管理员账号创建成功');
    console.log('用户名: admin');
    console.log('密码: 请查看环境变量 ADMIN_DEFAULT_PASSWORD 或在首次登录后立即修改');
    if (!process.env.ADMIN_DEFAULT_PASSWORD) {
      console.log('⚠️  警告：使用默认密码，请在首次登录后立即修改！');
    }

    process.exit(0);
  } catch (error) {
    console.error('初始化管理员失败:', error);
    process.exit(1);
  }
}

initAdmin();
