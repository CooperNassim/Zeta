const { pool } = require('./src/config/database.js');

const today = new Date().toISOString().split('T')[0];

pool.query(`SELECT * FROM psychological_test_results WHERE test_date::date = '${today}' AND deleted = false`)
  .then(result => {
    if (result.rows.length === 0) {
      console.log('今天没有数据');
    } else {
      console.log('今天的数据:');
      console.log(JSON.stringify(result.rows, null, 2));
    }
    pool.end();
  })
  .catch(error => {
    console.error('错误:', error);
    pool.end();
    process.exit(1);
  });
