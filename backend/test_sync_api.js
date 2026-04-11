const axios = require('axios');
const { pool } = require('./src/config/database');

async function testDataSync() {
  console.log('🔧 开始测试后端API和双表同步...\n');

  // 1. 测试基础连接
  console.log('1. 测试后端服务基础连接...');
  try {
    const testResponse = await axios.get('http://localhost:3001/api/test', { timeout: 5000 });
    console.log('✅ 后端服务连接成功:', testResponse.data);
  } catch (error) {
    console.log('❌ 后端服务连接失败:', error.message);
    return;
  }

  // 2. 测试数据同步API
  console.log('\n2. 测试股票数据同步API...');
  
  const testStock = {
    symbol: '301563',
    name: '测试股票301563', 
    currentPrice: 15.68,
    prevClose: 15.50,
    changePercent: 1.16,
    volume: 1589000,
    highPrice: 15.80,
    lowPrice: 15.45,
    openPrice: 15.55,
    amount: 24800000,
    market: 'sz',
    timestamp: new Date().toISOString()
  };

  try {
    const response = await axios.post('http://localhost:3001/api/market-quotes/realtime/update', {
      stocks: [testStock]
    }, { timeout: 10000 });

    console.log('✅ API调用成功:', response.data);
    
    // 3. 等待数据库处理
    console.log('\n3. 等待数据库处理...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. 检查数据库同步结果
    console.log('\n4. 检查数据库同步结果...');
    
    const client = await pool.connect();
    try {
      // 检查market_quotes表
      const marketResult = await client.query('SELECT * FROM market_quotes WHERE symbol = $1', ['301563']);
      console.log('   market_quotes表记录:', marketResult.rows.length > 0 ? '存在' : '不存在');
      
      // 检查stock_pool表
      const poolResult = await client.query('SELECT * FROM stock_pool WHERE symbol = $1', ['301563']);
      console.log('   stock_pool表记录:', poolResult.rows.length > 0 ? '存在' : '不存在');
      
      // 检查表计数
      const marketCount = await client.query('SELECT COUNT(*) FROM market_quotes');
      const poolCount = await client.query('SELECT COUNT(*) FROM stock_pool');
      console.log('   总记录数: market_quotes=' + marketCount.rows[0].count, 'stock_pool=' + poolCount.rows[0].count);
      
      if (marketResult.rows.length > 0 && poolResult.rows.length > 0) {
        console.log('\n✅ 双表同步测试成功！');
      } else {
        console.log('\n❌ 双表同步存在问题！');
        if (marketResult.rows.length > 0) {
          console.log('   - market_quotes表有数据但stock_pool表为空');
          console.log('   - 需要验证双重保险同步逻辑');
        } else {
          console.log('   - 数据未正确保存到market_quotes表');
          console.log('   - 检查API存储逻辑');
        }
      }
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.log('❌ API调用失败:');
    if (error.code === 'ECONNREFUSED') {
      console.log('   后端服务未运行或端口被占用');
    } else if (error.response) {
      console.log('   错误详情:', error.response.data);
    } else {
      console.log('   未知错误:', error.message);
    }
  }

  console.log('\n📋 测试完成！');
}

// 运行测试
testDataSync()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('测试程序错误:', error);
    process.exit(1);
  });