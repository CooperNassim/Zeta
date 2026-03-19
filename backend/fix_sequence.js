const { pool } = require('./src/config/database');

(async () => {
  try {
    console.log('=== 修复 trading_strategies 主键序列 ===\n');

    // 1. 查看当前最大ID
    const maxIdRes = await pool.query('SELECT COALESCE(MAX(id), 0) as max_id FROM trading_strategies');
    const currentMaxId = parseInt(maxIdRes.rows[0].max_id);
    console.log(`1. 当前表中最大ID: ${currentMaxId}`);

    // 2. 查看当前序列值
    const seqValRes = await pool.query('SELECT last_value FROM trading_strategies_id_seq');
    const currentSeqVal = parseInt(seqValRes.rows[0].last_value);
    console.log(`2. 当前序列值: ${currentSeqVal}`);

    // 3. 重置序列
    const newSeqVal = currentMaxId + 1;
    await pool.query(`SELECT setval('trading_strategies_id_seq', ${newSeqVal}, false)`);
    console.log(`3. 序列已重置为: ${newSeqVal}`);

    // 4. 验证
    const nextValRes = await pool.query('SELECT nextval("trading_strategies_id_seq")');
    console.log(`4. 下一个ID: ${nextValRes.rows[0].nextval}`);

    // 5. 回滚一个（因为nextval已经自增了）
    await pool.query(`SELECT setval('trading_strategies_id_seq', ${newSeqVal}, false)`);

    await pool.end();
    console.log('\n✅ 序列修复完成!');
  } catch (error) {
    console.error('错误:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
