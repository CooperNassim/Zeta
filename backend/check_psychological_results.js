const {pool} = require('./src/config/database');

(async () => {
  try {
    const res = await pool.query('SELECT * FROM psychological_test_results ORDER BY id DESC LIMIT 5');
    console.log('psychological_test_results:');
    res.rows.forEach(r => {
      console.log(`id=${r.id}, test_date=${r.test_date}, indicators type=${typeof r.indicators}, total_score=${r.total_score}`);
      console.log('  indicators:', r.indicators);
    });
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    pool.end();
  }
})();
