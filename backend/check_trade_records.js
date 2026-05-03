const {pool} = require('./src/config/database');

(async () => {
  try {
    const res = await pool.query('SELECT id, trade_number, deleted, deleted_at FROM trade_records ORDER BY id');
    console.log('trade_records:');
    res.rows.forEach(r => console.log(`  id=${r.id}, trade_number="${r.trade_number}", deleted=${r.deleted}, deleted_at=${r.deleted_at}`));
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    pool.end();
  }
})();
