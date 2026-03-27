const { pool } = require('./src/config/database');

(async () => {
  try {
    // 检查备份表
    const backupCount = await pool.query('SELECT COUNT(*) FROM trade_records_backup_complete');
    console.log('=== trade_records_backup_complete 记录数 ===');
    console.log(JSON.stringify(backupCount.rows, null, 2));

    // 查看备份表结构
    const backupColumns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'trade_records_backup_complete'
      ORDER BY ordinal_position
    `);
    console.log('\n=== 备份表结构 ===');
    console.log(JSON.stringify(backupColumns.rows, null, 2));

    // 查看备份表数据示例
    const backupData = await pool.query('SELECT * FROM trade_records_backup_complete LIMIT 3');
    console.log('\n=== 备份表数据示例 ===');
    console.log(JSON.stringify(backupData.rows, null, 2));

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
  }
})();
