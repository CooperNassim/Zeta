-- ========================================
-- 交易记录表重构迁移脚本
-- 问题：当前表结构与前端 addOrder 发送的字段不匹配
-- 解决：按照前端需求重建表结构
-- ========================================

const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    console.log('========================================');
    console.log('开始重构 trade_records 表');
    console.log('========================================\n');

    // 1. 检查当前表结构
    console.log('1. 检查当前表结构...');
    const currentColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'trade_records' 
      ORDER BY ordinal_position
    `);
    console.log('   当前表结构:');
    console.table(currentColumns.rows);

    // 2. 备份现有数据
    console.log('\n2. 备份现有数据...');
    await client.query('DROP TABLE IF EXISTS trade_records_backup_new CASCADE');
    await client.query('CREATE TABLE trade_records_backup_new AS SELECT * FROM trade_records');
    const backupCount = await client.query('SELECT COUNT(*) FROM trade_records_backup_new');
    console.log(`   ✅ 已备份 ${backupCount.rows[0].count} 条记录\n`);

    // 3. 删除旧表
    console.log('3. 删除旧表...');
    await client.query('DROP TABLE IF EXISTS trade_records CASCADE');
    console.log('   ✅ 旧表已删除\n');

    // 4. 创建新表 - 完全匹配前端 addOrder 发送的字段
    console.log('4. 创建新表...');
    const createSQL = `
      CREATE TABLE trade_records (
        -- 主键和系统字段
        id SERIAL PRIMARY KEY,
        deleted BOOLEAN NOT NULL DEFAULT false,
        deleted_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,

        -- 交易基本信息
        trade_number VARCHAR(50) NOT NULL,
        trade_type VARCHAR(20) NOT NULL,
        symbol VARCHAR(50) NOT NULL,
        name VARCHAR(200),
        is_virtual BOOLEAN DEFAULT false,

        -- 订单关联信息
        buy_order_id INTEGER NULL,
        sell_order_id INTEGER NULL,

        -- 买入相关字段
        buy_price NUMERIC(20, 4) NULL,
        buy_quantity INTEGER NULL,
        buy_time TIMESTAMPTZ NULL,
        buy_order_price NUMERIC(20, 4) NULL,
        buy_order_time TIMESTAMPTZ NULL,
        buy_psychological_score NUMERIC(5, 2) NULL,
        buy_strategy_score NUMERIC(5, 2) NULL,
        buy_strategy_id INTEGER NULL,
        buy_grade VARCHAR(10) NULL,
        buy_amount NUMERIC(20, 2) NULL,

        -- 卖出相关字段
        sell_price NUMERIC(20, 4) NULL,
        sell_quantity INTEGER NULL,
        sell_time TIMESTAMPTZ NULL,
        sell_order_price NUMERIC(20, 4) NULL,
        sell_order_time TIMESTAMPTZ NULL,
        sell_psychological_score NUMERIC(5, 2) NULL,
        sell_strategy_score NUMERIC(5, 2) NULL,
        sell_strategy_id INTEGER NULL,
        sell_grade VARCHAR(10) NULL,
        sell_amount NUMERIC(20, 2) NULL,

        -- 金额和盈亏信息
        profit NUMERIC(20, 2) NULL,
        profit_percent NUMERIC(10, 4) NULL,
        hold_duration INTEGER NULL,
        overall_score NUMERIC(5, 2) NULL,

        -- 通道数据（JSON格式）
        buy_channel JSON NULL,
        sell_channel JSON NULL,

        -- 费用相关
        trade_commission NUMERIC(20, 2) NULL,
        other_fees NUMERIC(20, 2) NULL,
        slippage NUMERIC(20, 2) NULL,
        net_profit NUMERIC(20, 2) NULL,
        net_profit_percent NUMERIC(10, 4) NULL,
        slippage_net_profit_ratio NUMERIC(10, 4) NULL,

        -- 交易总结
        trade_summary TEXT NULL
      );
    `;
    await client.query(createSQL);
    console.log('   ✅ 新表已创建\n');

    // 5. 创建索引
    console.log('5. 创建索引...');
    await client.query('CREATE INDEX idx_trade_records_trade_number ON trade_records(trade_number)');
    await client.query('CREATE INDEX idx_trade_records_symbol ON trade_records(symbol)');
    await client.query('CREATE INDEX idx_trade_records_deleted ON trade_records(deleted)');
    await client.query('CREATE INDEX idx_trade_records_created_at ON trade_records(created_at DESC)');
    console.log('   ✅ 索引已创建\n');

    // 6. 尝试从备份恢复数据（如果字段能匹配上）
    console.log('6. 尝试恢复数据...');
    const backupColumns = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'trade_records_backup_new' 
      ORDER BY ordinal_position
    `);
    const backupCols = backupColumns.rows.map(r => r.column_name);
    console.log('   备份表包含的字段:', backupCols.join(', '));

    // 尝试映射备份数据到新表
    const fieldMapping = {
      'trade_number': 'trade_number',
      'symbol': 'symbol',
      'name': 'name',
      'buy_price': 'buy_price',
      'sell_price': 'sell_price',
      'quantity': 'buy_quantity',
      'profit': 'profit',
      'profit_rate': 'profit_percent',
      'holding_days': 'hold_duration',
      'entry_date': 'buy_time',
      'exit_date': 'sell_time',
      'entry_price': 'buy_price',
      'exit_price': 'sell_price'
    };

    // 检查有哪些字段可以迁移
    const mappableFields = Object.keys(fieldMapping).filter(k => backupCols.includes(k));
    console.log(`   可迁移的字段: ${mappableFields.join(', ')}`);

    if (mappableFields.length > 0) {
      // 构建INSERT语句
      const newFields = mappableFields.map(k => fieldMapping[k]);
      const insertSQL = `
        INSERT INTO trade_records (${newFields.join(', ')})
        SELECT ${newFields.join(', ')} FROM trade_records_backup_new
      `;
      try {
        const result = await client.query(insertSQL);
        console.log(`   ✅ 成功恢复 ${result.rowCount} 条记录\n`);
      } catch (err) {
        console.log(`   ⚠️ 恢复失败: ${err.message}\n`);
        console.log('   将创建新的空表，请通过前端重新添加交易记录\n');
      }
    }

    // 7. 验证新表结构
    console.log('7. 验证新表结构...');
    const newColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'trade_records' 
      ORDER BY ordinal_position
    `);
    console.log('   新表结构:');
    console.table(newColumns.rows);

    // 8. 检查记录数
    console.log('8. 检查记录数...');
    const countResult = await client.query('SELECT COUNT(*) FROM trade_records');
    console.log(`   当前记录数: ${countResult.rows[0].count}`);

    console.log('\n========================================');
    console.log('重构完成！');
    console.log('========================================');
    console.log('\n注意: 如果记录数为0，请通过前端重新添加交易记录');
    console.log('旧备份表 trade_records_backup_new 如确认无误可手动删除\n');

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
})();
