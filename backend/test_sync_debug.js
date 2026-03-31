/**
 * 测试 /api/sync/all 接口
 */
const { pool } = require('./src/config/database');

async function testSyncAll() {
  const client = await pool.connect();
  
  try {
    console.log('========================================');
    console.log('测试 /api/sync/all 接口');
    console.log('========================================\n');

    const tables = [
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

    const syncData = {};

    for (const table of tables) {
      console.log(`[Test] 处理表: ${table}`);
      try {
        const result = await client.query(`SELECT * FROM ${table}`);
        console.log(`[Test] 表 ${table} 查询成功，记录数: ${result.rows.length}`);
        
        // 特殊处理日期格式，转换为 YYYY-MM-DD 字符串
        if (table === 'psychological_test_results') {
          syncData[table] = result.rows.map(item => {
            console.log(`[Test] 处理心理测试结果: test_date = ${item.test_date}, type = ${typeof item.test_date}`);
            return {
              ...item,
              test_date: item.test_date ? (() => {
                const dateObj = new Date(item.test_date);
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              })() : null
            };
          });
        } else if (table === 'daily_work_data') {
          syncData[table] = result.rows.map(item => ({
            ...item,
            date: item.date ? (() => {
              const dateObj = new Date(item.date);
              const year = dateObj.getFullYear();
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const day = String(dateObj.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            })() : null
          }));
        } else {
          syncData[table] = result.rows;
        }
      } catch (err) {
        console.error(`[Test] 表 ${table} 出错:`, err.message);
        console.error(`[Test] 错误详情:`, err);
        syncData[table] = [];
      }
    }

    console.log('\n[Test] 同步完成');
    console.log('[Test] 返回的数据:');
    console.log(JSON.stringify(syncData, null, 2).substring(0, 500) + '...');

  } catch (error) {
    console.error('[Test] 执行出错:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testSyncAll();
