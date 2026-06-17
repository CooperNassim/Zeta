const { pool } = require('../src/config/database');

async function checkAdmin() {
  try {
    const result = await pool.query('SELECT id, username, role, status, password_hash FROM users WHERE username = $1', ['admin']);
    if (result.rows.length === 0) {
      console.log('❌ admin 用户不存在');
    } else {
      console.log('✅ admin 用户存在:', JSON.stringify(result.rows[0], null, 2));
    }
    
    // 验证密码
    const { verifyPassword } = require('../src/utils/password');
    const valid = await verifyPassword('admin123', result.rows[0].password_hash);
    console.log('密码验证结果:', valid ? '✅ 正确' : ' 错误');
    
    process.exit(0);
  } catch (e) {
    console.error('❌ 检查失败:', e.message);
    process.exit(1);
  }
}

checkAdmin();
