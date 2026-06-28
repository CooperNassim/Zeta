const { pool } = require('./src/config/database');
const { hashPassword } = require('./src/utils/password');

(async () => {
  try {
    const hash = await hashPassword('admin123');
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role, status) VALUES ($1, $2, $3, $4) RETURNING id, username',
      ['admin', hash, 'admin', 'active']
    );
    console.log('✅ Admin 用户创建成功:', result.rows[0]);
  } catch (error) {
    console.error('❌ 创建失败:', error.message);
  } finally {
    await pool.end();
  }
})();
