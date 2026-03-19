const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('步骤 1: 删除触发器 auto_generate_strategy_id');
    await client.query('DROP TRIGGER IF EXISTS auto_generate_strategy_id ON trading_strategies');
    await client.query('DROP FUNCTION IF EXISTS generate_trading_strategy_id()');
    console.log('✅ 触发器已删除');

    console.log('\n步骤 2: 删除 _id 字段的唯一约束');
    await client.query('ALTER TABLE trading_strategies DROP CONSTRAINT IF EXISTS trading_strategies__id_key');
    console.log('✅ 唯一约束已删除');

    console.log('\n步骤 3: 删除旧的 _id 字段');
    await client.query('ALTER TABLE trading_strategies DROP COLUMN IF EXISTS _id');
    console.log('✅ 旧 _id 字段已删除');

    console.log('\n步骤 4: 创建新的 revision_version 字段(修订版本)');
    await client.query(`
      ALTER TABLE trading_strategies
      ADD COLUMN IF NOT EXISTS revision_version VARCHAR(50)
    `);
    console.log('✅ revision_version 字段已创建');

    console.log('\n步骤 5: 为现有记录设置默认修订版本');
    await client.query(`
      UPDATE trading_strategies
      SET revision_version = 'V' || LPAD(id::TEXT, 2, '0') || '.0.0'
      WHERE revision_version IS NULL OR revision_version = ''
    `);
    console.log('✅ 现有记录已更新');

    await client.query('COMMIT');
    console.log('\n✅ 所有操作完成!');

    // 验证结果
    console.log('\n验证结果:');
    const result = await pool.query(`
      SELECT id, name, revision_version, status
      FROM trading_strategies
      WHERE deleted = false
      ORDER BY id
      LIMIT 5
    `);
    console.log('前5条记录:');
    result.rows.forEach(row => {
      console.log(`  ID: ${row.id}, 名称: ${row.name}, 修订版本: ${row.revision_version}, 状态: ${row.status}`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 错误:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
})();
