require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function debugDataFlow() {
  const client = await pool.connect();
  try {
    console.log('🔍 逐层排查数据流问题...\n');

    // 1. 先确认数据库确实有数据
    console.log('1. ✅ 数据库确认检查:');
    const stockPoolCheck = await client.query(`
      SELECT symbol, name, current_price, change_percent, status, updated_at 
      FROM stock_pool 
      WHERE symbol = '301563';
    `);
    console.log(`   stock_pool表: ${stockPoolCheck.rows.length} 条记录`);
    stockPoolCheck.rows.forEach(row => {
      console.log(`   - ${row.symbol} | ${row.name} | ¥${row.current_price} | ${row.change_percent}% | ${row.status}`);
    });

    // 2. 测试修复后的API查询
    console.log('\n2. 🚀 测试修复后的API查询逻辑:');
    const apiQueryResult = await client.query(`
      SELECT 
        symbol, name, current_price, change_percent, market, sector, 
        status, updated_at as timestamp, NULL as prev_close, 0 as volume
      FROM stock_pool 
      WHERE status != 'deleted'
      ORDER BY symbol
    `);
    console.log(`   查询结果: ${apiQueryResult.rows.length} 条记录`);
    console.log(`   包含301563: ${apiQueryResult.rows.some(row => row.symbol === '301563')}`);
    
    // 显示前5条记录确认数据正确
    console.log('   前5条记录:');
    apiQueryResult.rows.slice(0, 5).forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.symbol} | ${row.name} | ¥${row.current_price} | ${row.change_percent}%`);
    });

    // 3. 检查API接口是否能正常访问
    console.log('\n3. 🌐 API接口测试:');
    try {
      const http = require('http');
      const apiTest = await new Promise((resolve) => {
        const req = http.request('http://localhost:3001/api/market-quotes/realtime', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const jsonData = JSON.parse(data);
              resolve(jsonData);
            } catch (parseError) {
              resolve({ error: parseError.message, rawData: data });
            }
          });
        });
        
        req.on('error', () => resolve({ error: 'API请求失败' }));
        req.setTimeout(5000, () => resolve({ error: 'API请求超时' }));
        req.end();
      });

      if (apiTest.success) {
        console.log(`   ✅ API响应正常: ${apiTest.count} 条数据`);
        console.log(`   包含301563: ${apiTest.data.some(item => item.symbol === '301563')}`);
        
        if (apiTest.data.some(item => item.symbol === '301563')) {
          const stockInfo = apiTest.data.find(item => item.symbol === '301563');
          console.log(`   301563详情: ${stockInfo.symbol} | ${stockInfo.name} | ¥${stockInfo.current_price}`);
        }
      } else {
        console.log(`   ❌ API响应错误: ${apiTest.message || apiTest.error}`);
      }
      
    } catch (apiError) {
      console.log(`   ❌ API测试异常: ${apiError.message}`);
    }

    // 4. 检查数据格式化问题
    console.log('\n4. 📊 数据格式兼容性检查:');
    const sampleData = apiQueryResult.rows.filter(row => row.symbol === '301563');
    if (sampleData.length > 0) {
      const stock = sampleData[0];
      console.log('   301563数据格式:');
      console.log(`   - symbol: ${stock.symbol} (类型: ${typeof stock.symbol})`);
      console.log(`   - name: ${stock.name} (类型: ${typeof stock.name})`);
      console.log(`   - current_price: ${stock.current_price} (类型: ${typeof stock.current_price})`);
      console.log(`   - change_percent: ${stock.change_percent} (类型: ${typeof stock.change_percent})`);
      console.log(`   - status: ${stock.status} (类型: ${typeof stock.status})`);
    }

    // 5. 检查可能的过滤条件问题
    console.log('\n5. 🔍 前端可能的过滤条件:');
    const allStocks = await client.query(`
      SELECT symbol, name, market, sector, status, current_price
      FROM stock_pool 
      WHERE status != 'deleted'
      ORDER BY symbol
    `);
    
    console.log(`   全部活跃股票: ${allStocks.rows.length} 只`);
    console.log(`   市场分布: ${Array.from(new Set(allStocks.rows.map(s => s.market))).join(', ')}`);
    console.log(`   行业分布: ${Array.from(new Set(allStocks.rows.map(s => s.sector))).join(', ')}`);
    
  } catch (error) {
    console.error('❌ 调试过程中出错:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

debugDataFlow().catch(console.error);