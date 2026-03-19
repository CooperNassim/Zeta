const db = require('./backend/src/database/connection.js');

db.query('SELECT id, test_date, overall_score, scores FROM psychological_test_results WHERE deleted = false ORDER BY id DESC LIMIT 5', (err, results) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log('心理测试数据:');
  console.table(results);
  process.exit();
});
