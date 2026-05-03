const {pool} = require('./src/config/database');

(async () => {
  try {
    const result = await pool.query(
      'UPDATE trade_records SET deleted = true, deleted_at = NOW() WHERE trade_number = $1',
      ['20260503006']
    );
    console.log(`已更新 ${result.rowCount} 条记录`);
    
    // 验证
    const verify = await pool.query('SELECT id, trade_number, deleted, deleted_at FROM trade_records WHERE trade_number = $1', ['20260503006']);
    console.log('验证结果:', verify.rows);
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    pool.end();
  }
})();
