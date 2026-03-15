const { pool } = require('./src/config/database');
const { findAll } = require('./src/database/queries');

(async () => {
  try {
    console.log('正在查询 psychological_indicators 表...');
    const result = await findAll('psychological_indicators');
    console.log('查询结果数量:', result.length);
    if (result.length > 0) {
      console.log('第一条数据:', result[0]);
    }
    await pool.end();
  } catch (error) {
    console.error('查询失败:', error);
    process.exit(1);
  }
})();
