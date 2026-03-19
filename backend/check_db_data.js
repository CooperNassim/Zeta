const { pool } = require('./src/config/database.js');

pool.query('SELECT id, test_date, scores, overall_score, overall_score::text as score_text FROM psychological_test_results WHERE deleted = false ORDER BY id DESC LIMIT 3')
  .then(result => {
    console.log('数据库中的记录:');
    console.log(JSON.stringify(result.rows, null, 2));
    pool.end();
  })
  .catch(error => {
    console.error('错误:', error);
    pool.end();
    process.exit(1);
  });
