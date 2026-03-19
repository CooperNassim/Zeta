const { pool } = require('./src/config/database');

(async () => {
  try {
    console.log('=== 添加 _id (修订版本) 字段 ===\n');

    // 检查字段是否已存在
    const check = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'trading_strategies' AND column_name = '_id'
    `);

    if (check.rows.length > 0) {
      console.log('_id 字段已存在');
    } else {
      console.log('添加 _id 字段...');
      await pool.query(`
        ALTER TABLE trading_strategies
        ADD COLUMN _id VARCHAR(20) DEFAULT 'V1.0.0'
      `);
      console.log('✅ _id 字段添加成功');
    }

    // 为现有记录设置默认值
    console.log('\n更新现有记录...');
    await pool.query(`
      UPDATE trading_strategies
      SET _id = 'V1.0.0'
      WHERE _id IS NULL
    `);
    console.log('✅ 现有记录已更新');

    // 验证
    const verify = await pool.query('SELECT id, name, _id FROM trading_strategies LIMIT 3');
    console.log('\n验证结果:');
    verify.rows.forEach(r => console.log(`   ID:${r.id}, 名称:${r.name}, 修订版本:${r._id}`));

    await pool.end();
    console.log('\n✅ 完成!');
  } catch (error) {
    console.error('错误:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
