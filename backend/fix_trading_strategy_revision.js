const { pool } = require('./src/config/database');

(async () => {
  try {
    console.log('=== 修复交易策略修订版本(_id)字段 ===\n');

    // 1. 确保 _id 字段存在
    console.log('1. 检查 _id 字段...');
    const checkField = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'trading_strategies' AND column_name = '_id'
    `);

    if (checkField.rows.length === 0) {
      console.log('   添加 _id 字段...');
      await pool.query(`
        ALTER TABLE trading_strategies
        ADD COLUMN _id VARCHAR(20) DEFAULT 'V1.0.0'
      `);
      console.log('   ✅ _id 字段添加成功');
    } else {
      console.log('   ✅ _id 字段已存在');
      console.log(`   - 数据类型: ${checkField.rows[0].data_type}`);
      console.log(`   - 默认值: ${checkField.rows[0].column_default}`);
    }

    // 2. 为现有的空 _id 设置值
    console.log('\n2. 为空 _id 设置默认值...');
    const updateResult = await pool.query(`
      UPDATE trading_strategies
      SET _id = 'V1.0.0'
      WHERE _id IS NULL OR _id = ''
      RETURNING id, name
    `);
    console.log(`   ✅ 更新了 ${updateResult.rows.length} 条记录`);

    // 3. 为所有记录生成唯一的 _id 值
    console.log('\n3. 生成唯一 _id 值...');
    const generateResult = await pool.query(`
      UPDATE trading_strategies
      SET _id = CONCAT('V', LPAD(id::text, 2, '0'), '.0.0')
      WHERE _id = 'V1.0.0'
      RETURNING id, name, _id
    `);
    console.log(`   ✅ 生成了 ${generateResult.rows.length} 个唯一 _id 值`);
    generateResult.rows.forEach(r => {
      console.log(`      - ID:${r.id}, 名称:${r.name}, 修订版本:${r._id}`);
    });

    // 4. 检查是否已有唯一约束
    console.log('\n4. 检查唯一约束...');
    const checkConstraint = await pool.query(`
      SELECT conname
      FROM pg_constraint
      WHERE conname = 'trading_strategies__id_key'
    `);

    if (checkConstraint.rows.length === 0) {
      console.log('   添加唯一约束...');
      await pool.query(`
        ALTER TABLE trading_strategies
        ADD CONSTRAINT trading_strategies__id_key UNIQUE (_id)
      `);
      console.log('   ✅ 唯一约束添加成功');
    } else {
      console.log('   ✅ 唯一约束已存在');
    }

    // 5. 创建索引
    console.log('\n5. 创建索引...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_trading_strategies__id
      ON trading_strategies (_id)
    `);
    console.log('   ✅ 索引创建成功');

    // 6. 验证
    console.log('\n6. 验证结果...');
    const verify = await pool.query(`
      SELECT id, name, _id, strategy_type, status
      FROM trading_strategies
      WHERE deleted = false
      ORDER BY id
      LIMIT 10
    `);
    console.log(`   当前记录数: ${verify.rowCount}`);
    verify.rows.forEach(r => {
      console.log(`   - ID:${r.id}, 名称:${r.name}, 修订版本:${r._id}, 类型:${r.strategy_type}, 状态:${r.status}`);
    });

    // 7. 测试通过 _id 查询
    console.log('\n7. 测试通过 _id 查询...');
    if (verify.rows.length > 0) {
      const testId = verify.rows[0]._id;
      const testResult = await pool.query(`
        SELECT * FROM trading_strategies
        WHERE _id = $1 AND deleted = false
      `, [testId]);
      console.log(`   测试 _id: ${testId}`);
      console.log(`   ✅ 查询到 ${testResult.rowCount} 条记录`);
    }

    await pool.end();
    console.log('\n✅ 所有修复完成!');
    console.log('\n说明:');
    console.log('- 主键: id (SERIAL, 自动递增, 保持不变)');
    console.log('- 修订版本: _id (唯一约束, 格式: V01.0.0, V02.0.0...)');
    console.log('- 前端可以同时使用 id 或 _id 进行查询和更新');
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error.stack);
    await pool.end();
    process.exit(1);
  }
})();
