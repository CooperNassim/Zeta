require('dotenv').config();
const { pool } = require('./src/config/database');

async function checkTables() {
  console.log('=== 检查数据库中的表 ===\n');

  try {
    // 获取所有表
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('数据库中的所有表:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    console.log('\n');

    // sync/all 路由需要查询的表
    const syncTables = [
      'account',
      'daily_work_data',
      'psychological_indicators',
      'psychological_test_results',
      'trading_strategies',
      'risk_config',
      'technical_indicators',
      'trade_orders',
      'transactions',
      'trade_records',
      'stock_pool',
      'stock_kline_data',
      'strategy_records'
    ];

    console.log('sync/all 路由需要查询的表:');
    for (const table of syncTables) {
      const exists = tablesResult.rows.some(row => row.table_name === table);
      const status = exists ? '✅ 存在' : '❌ 不存在';
      console.log(`  ${status} - ${table}`);

      // 如果表存在，尝试查询数据
      if (exists) {
        try {
          const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
          console.log(`    数据量: ${result.rows[0].count} 条`);
        } catch (err) {
          console.log(`    查询失败: ${err.message}`);
        }
      }
    }
    console.log('\n');

    // 测试 sync/all 接口
    console.log('=== 测试 sync/all 接口 ===');
    const syncData = {};
    
    for (const table of syncTables) {
      try {
        const data = await pool.query(`SELECT * FROM ${table} WHERE deleted = false OR deleted IS NULL`);
        syncData[table] = data.rows;
        console.log(`✅ ${table}: ${data.rows.length} 条记录`);
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
        syncData[table] = [];
      }
    }

    console.log('\n=== 总结 ===');
    console.log(`成功查询的表: ${Object.keys(syncData).length} 个`);
    console.log(`总记录数: ${Object.values(syncData).reduce((sum, arr) => sum + arr.length, 0)} 条`);

  } catch (error) {
    console.error('错误:', error);
  } finally {
    await pool.end();
  }
}

checkTables();
