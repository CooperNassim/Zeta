require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('../config/database');

(async () => {
  try {
    const result = await pool.query('SELECT * FROM psychological_indicators WHERE deleted = false LIMIT 1');
    console.log('psychological_indicators 表数据:');
    if (result.rows.length > 0) {
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('  (空)');
    }
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await pool.end();
  }
})();
