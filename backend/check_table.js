const { pool } = require('./src/config/database');

(async () => {
  try {
    const r = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'trade_records'
      ORDER BY ordinal_position
    `);
    console.log('=== trade_records 表结构 ===');
    console.log(JSON.stringify(r.rows, null, 2));

    // 检查表是否存在
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_name LIKE 'trade_records%'
    `);
    console.log('\n=== 相关表 ===');
    console.log(JSON.stringify(tables.rows, null, 2));

    // 检查数据量
    const count = await pool.query('SELECT COUNT(*) FROM trade_records');
    console.log('\n=== 记录数 ===');
    console.log(JSON.stringify(count.rows, null, 2));

    // 检查备份表
    const backupCount = await pool.query('SELECT COUNT(*) FROM trade_records_backup_new');
    console.log('\n=== 备份表记录数 ===');
    console.log(JSON.stringify(backupCount.rows, null, 2));

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
  }
})();
