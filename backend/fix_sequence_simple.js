const { pool } = require('./src/config/database');

(async () => {
  try {
    console.log('=== 修复序列 ===\n');

    // 获取最大ID
    const maxRes = await pool.query('SELECT COALESCE(MAX(id), 0) as max FROM trading_strategies');
    const maxId = parseInt(maxRes.rows[0].max);
    console.log('最大ID:', maxId);

    // 检查序列是否存在
    const seqCheck = await pool.query(
      "SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'trading_strategies_id_seq'"
    );

    if (seqCheck.rows.length === 0) {
      console.log('序列不存在，创建序列...');
      await pool.query(`CREATE SEQUENCE trading_strategies_id_seq START WITH ${maxId + 1}`);
      await pool.query(`ALTER TABLE trading_strategies ALTER COLUMN id SET DEFAULT nextval('trading_strategies_id_seq')`);
      await pool.query(`ALTER SEQUENCE trading_strategies_id_seq OWNED BY trading_strategies.id`);
    } else {
      console.log('序列存在，重置序列值...');
      await pool.query(`SELECT setval('trading_strategies_id_seq', ${maxId}, true)`);
    }

    console.log('✅ 修复完成');

    await pool.end();
  } catch (error) {
    console.error('错误:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
