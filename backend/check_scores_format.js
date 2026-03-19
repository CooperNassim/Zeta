const { pool } = require('./src/config/database.js');

pool.query('SELECT id, test_date, scores, overall_score FROM psychological_test_results WHERE deleted = false ORDER BY id DESC LIMIT 2')
  .then(result => {
    console.log('数据库中的记录:');
    result.rows.forEach(row => {
      console.log('ID:', row.id);
      console.log('test_date:', row.test_date);
      console.log('scores type:', typeof row.scores);
      console.log('scores:', JSON.stringify(row.scores));
      console.log('overall_score type:', typeof row.overall_score);
      console.log('overall_score:', row.overall_score);
      console.log('---');
    });
    pool.end();
  })
  .catch(error => {
    console.error('错误:', error);
    pool.end();
    process.exit(1);
  });
