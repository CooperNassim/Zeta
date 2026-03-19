const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('=== 重新创建 trading_strategies_id_seq 序列 ===\n');

    // 1. 删除旧序列（如果存在）
    console.log('1. 删除旧序列...');
    await client.query('DROP SEQUENCE IF EXISTS trading_strategies_id_seq CASCADE');

    // 2. 获取当前最大ID
    const maxIdRes = await client.query('SELECT COALESCE(MAX(id), 0) as max_id FROM trading_strategies');
    const currentMaxId = parseInt(maxIdRes.rows[0].max_id);
    console.log(`2. 当前表中最大ID: ${currentMaxId}`);

    // 3. 创建新序列
    console.log(`3. 创建新序列，起始值: ${currentMaxId + 1}`);
    await client.query(`CREATE SEQUENCE trading_strategies_id_seq START ${currentMaxId + 1}`);

    // 4. 将序列与表的id列关联
    console.log('4. 关联序列到表...');
    await client.query(`ALTER TABLE trading_strategies ALTER COLUMN id SET DEFAULT nextval('trading_strategies_id_seq')`);
    await client.query(`ALTER SEQUENCE trading_strategies_id_seq OWNED BY trading_strategies.id`);

    await client.query('COMMIT');

    console.log('\n✅ 序列重建完成!');

    // 5. 测试新增
    const testInsert = await pool.query(
      `INSERT INTO trading_strategies (strategy_type, name, status, deleted, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, name`,
      ['test_type', '测试序列_临时', '启用', false]
    );
    console.log(`\n测试新增: ID=${testInsert.rows[0].id}, 名称=${testInsert.rows[0].name}`);

    // 6. 清理测试数据
    await pool.query('DELETE FROM trading_strategies WHERE name = $1', ['测试序列_临时']);
    console.log('测试数据已清理');

    await pool.end();
    console.log('\n✅ 所有操作完成!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('错误:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
