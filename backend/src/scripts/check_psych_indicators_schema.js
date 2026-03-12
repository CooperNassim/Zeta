require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('../config/database');

(async () => {
  try {
    const result = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'psychological_indicators' ORDER BY ordinal_position"
    );
    console.log('psychological_indicators 表字段:');
    result.rows.forEach(row => console.log(`  ${row.column_name}: ${row.data_type}`));
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await pool.end();
  }
})();
