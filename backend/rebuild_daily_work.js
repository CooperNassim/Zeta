const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    console.log('========================================');
    console.log('开始重构 daily_work_data 表');
    console.log('========================================\n');

    // 1. 备份现有数据
    console.log('1. 备份现有数据...');
    await client.query('DROP TABLE IF EXISTS daily_work_data_backup CASCADE');
    await client.query('CREATE TABLE daily_work_data_backup AS SELECT * FROM daily_work_data');
    const backupCount = await client.query('SELECT COUNT(*) FROM daily_work_data_backup');
    console.log(`   ✅ 已备份 ${backupCount.rows[0].count} 条记录\n`);

    // 2. 删除旧表
    console.log('2. 删除旧表...');
    await client.query('DROP TABLE IF EXISTS daily_work_data CASCADE');
    console.log('   ✅ 旧表已删除\n');

    // 3. 创建新表 - 完全匹配前端字段
    console.log('3. 创建新表...');
    const createSQL = `
      CREATE TABLE daily_work_data (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,

        -- 指标数据 (13个字段)
        nasdaq TEXT,
        ftse TEXT,
        dax TEXT,
        n225 TEXT,
        hsi TEXT,
        bitcoin TEXT,
        eurusd TEXT,
        usdjpy TEXT,
        usdcny TEXT,
        oil TEXT,
        gold TEXT,
        bond TEXT,
        consecutive TEXT,

        -- 市场数据 (8个字段)
        a50 TEXT,
        sh_index TEXT,
        sh_2day_power TEXT,
        sh_13day_power TEXT,
        up_count TEXT,
        limit_up TEXT,
        down_count TEXT,
        limit_down TEXT,
        volume TEXT,

        -- 评估字段 (3个字段)
        sentiment TEXT CHECK (sentiment IN ('冰点', '过冷', '微冷', '微热', '过热', '沸点')),
        prediction TEXT CHECK (prediction IN ('看涨', '看跌')),
        trade_status TEXT CHECK (trade_status IN ('积极地', '保守地', '防御地')),

        -- 审核字段 (3个字段)
        review_plan TEXT,
        review_execution TEXT,
        review_result TEXT,

        -- 软删除和时间戳 (4个字段)
        deleted BOOLEAN NOT NULL DEFAULT false,
        deleted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await client.query(createSQL);
    console.log('   ✅ 新表创建完成\n');

    // 4. 创建索引
    console.log('4. 创建索引...');
    await client.query('CREATE INDEX idx_daily_work_date ON daily_work_data(date)');
    await client.query('CREATE INDEX idx_daily_work_deleted ON daily_work_data(deleted)');
    await client.query('CREATE INDEX idx_daily_work_sentiment ON daily_work_data(sentiment)');
    await client.query('CREATE INDEX idx_daily_work_trade_status ON daily_work_data(trade_status)');
    console.log('   ✅ 索引创建完成\n');

    // 5. 创建触发器 - 自动更新 updated_at
    console.log('5. 创建触发器...');
    const triggerSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      CREATE TRIGGER update_daily_work_data_updated_at
        BEFORE UPDATE ON daily_work_data
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;
    await client.query(triggerSQL);
    console.log('   ✅ 触发器创建完成\n');

    // 6. 插入示例数据
    console.log('6. 插入示例数据...');
    const insertSQL = `
      INSERT INTO daily_work_data (
        date, nasdaq, ftse, dax, n225, hsi, bitcoin, eurusd, usdjpy, usdcny,
        oil, gold, bond, consecutive, a50, sh_index, sh_2day_power, sh_13day_power,
        up_count, limit_up, down_count, limit_down, volume,
        sentiment, prediction, trade_status,
        review_plan, review_execution, review_result
      ) VALUES
      (
        '2026-03-10', '16500', '8200', '18200', '39500', '18500', '68000',
        '1.09', '150.5', '7.19', '85', '2180', '120', '15', '12800', '3050',
        '-120', '800', '2800', '80', '2100', '15', '8500',
        '微热', '看涨', '积极地',
        '测试计划内容', '测试执行内容', '测试结果内容'
      ),
      (
        '2026-03-09', '16400', '8150', '18100', '39300', '18400', '67200',
        '1.08', '149.8', '7.18', '84', '2170', '119', '12', '12700', '3030',
        '-130', '750', '2600', '65', '2300', '18', '8200',
        '微冷', '看跌', '保守地',
        NULL, NULL, NULL
      ),
      (
        '2026-03-08', '16300', '8100', '18000', '39100', '18300', '66500',
        '1.07', '149.2', '7.17', '83', '2160', '118', '10', '12600', '3010',
        '-100', '700', '2400', '55', '2500', '20', '8000',
        '冰点', '看跌', '防御地',
        NULL, NULL, NULL
      )
    `;
    await client.query(insertSQL);
    console.log('   ✅ 示例数据插入完成\n');

    // 7. 验证结果
    console.log('7. 验证结果...');
    const columnRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'daily_work_data'
      ORDER BY ordinal_position
    `);

    console.log(`   表字段总数: ${columnRes.rowCount}`);
    console.log('\n   字段列表:');
    columnRes.rows.forEach((col, idx) => {
      console.log(`   ${idx + 1}. ${col.column_name.padEnd(20)} ${col.data_type.padEnd(25)} ${col.is_nullable}`);
    });

    const dataCount = await client.query('SELECT COUNT(*) FROM daily_work_data WHERE deleted = false');
    console.log(`\n   数据记录数: ${dataCount.rows[0].count}`);

    // 8. 测试读取
    console.log('\n8. 测试数据读取...');
    const testRes = await client.query(`
      SELECT id, date, sentiment, prediction, trade_status
      FROM daily_work_data
      ORDER BY date DESC
      LIMIT 3
    `);

    console.log('   最近3条记录:');
    testRes.rows.forEach((row, idx) => {
      console.log(`   ${idx + 1}. ID:${row.id}, 日期:${row.date.toISOString().split('T')[0]}, 情绪:${row.sentiment}, 预测:${row.prediction}, 状态:${row.trade_status}`);
    });

    console.log('\n========================================');
    console.log('✅ 数据库重构完成！');
    console.log('========================================');
    console.log('\n字段统计:');
    console.log('  - 指标数据: 13个字段');
    console.log('  - 市场数据: 9个字段');
    console.log('  - 评估字段: 3个字段 (带CHECK约束)');
    console.log('  - 审核字段: 3个字段');
    console.log('  - 系统字段: 5个字段');
    console.log('  - 总计: 33个字段\n');

  } catch (error) {
    console.error('❌ 重构失败:', error.message);
    await client.query('ROLLBACK');
  } finally {
    client.release();
    pool.end();
  }
})();
