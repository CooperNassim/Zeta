const { pool } = require('./src/config/database.js');

const today = new Date().toISOString().split('T')[0];

pool.query(`UPDATE psychological_test_results SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE test_date::date = '${today}'`)
  .then(result => {
    console.log('已删除今天的数据:', result.rowCount, '条');
    pool.end();
  })
  .catch(error => {
    console.error('错误:', error);
    pool.end();
    process.exit(1);
  });
