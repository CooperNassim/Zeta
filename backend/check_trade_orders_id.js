const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    // 查看主键信息
    const pkResult = await client.query(`
      SELECT
        kcu.column_name,
        kcu.ordinal_position
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_name = 'trade_orders'
      AND tc.constraint_type = 'PRIMARY KEY'
      ORDER BY kcu.ordinal_position;
    `);

    console.log('trade_orders 主键:');
    console.table(pkResult.rows);

    // 查看序列
    const seqResult = await client.query(`
      SELECT sequence_name
      FROM information_schema.sequences
      WHERE sequence_name LIKE '%trade_orders%';
    `);

    console.log('\ntrade_orders 相关序列:');
    console.table(seqResult.rows);

    // 查看第一条记录
    const dataResult = await client.query("SELECT * FROM trade_orders LIMIT 1;");
    if (dataResult.rows.length > 0) {
      console.log('\ntrade_orders 第一条数据:');
      console.log(dataResult.rows[0]);
    }
  } finally {
    await client.release();
    await pool.end();
  }
})();
