import axios from 'axios';

async function testBackend() {
  console.log('=== 测试后端服务API端点 ===\n');

  // 测试健康检查端点
  console.log('1. 测试健康检查端点: /health');
  
  try {
    const response = await axios.get('http://localhost:3001/health', {
      timeout: 5000
    });
    
    console.log('   ✓ 健康检查通过，状态码:', response.status);
    console.log('     响应数据:', JSON.stringify(response.data));
  } catch (err) {
    console.log('   ✗ 健康检查失败:');
    console.log('     错误消息:', err.message);
    
    if (err.response) {
      console.log('     响应状态:', err.response.status);
      console.log('     响应数据:', JSON.stringify(err.response.data));
    }
  }

  // 测试行情数据同步端点
  console.log('\n2. 测试行情数据同步端点: /api/sync/all');
  
  try {
    const response = await axios.get('http://localhost:3001/api/sync/all', {
      timeout: 5000
    });
    
    console.log('   ✓ 数据同步端点可达，状态码:', response.status);
    console.log('     响应数据长度:', JSON.stringify(response.data).length, '字符');
  } catch (err) {
    console.log('   ✗ 数据同步端点失败:');
    console.log('     错误消息:', err.message);
    
    if (err.response) {
      console.log('     响应状态:', err.response.status);
      console.log('     响应数据:', JSON.stringify(err.response.data));
    }
  }

  // 测试实时行情接口  
  console.log('\n3. 测试实时行情接口: /api/market-quotes/realtime');
  
  try {
    const response = await axios.get('http://localhost:3001/api/market-quotes/realtime', {
      timeout: 5000,
      params: { symbol: '301563' }
    });
    
    console.log('   ✓ 实时行情接口可达，状态码:', response.status);
    console.log('     响应数据:', JSON.stringify(response.data));
  } catch (err) {
    console.log('   ✗ 实时行情接口失败:');
    console.log('     错误消息:', err.message);
    
    if (err.response) {
      console.log('     响应状态:', err.response.status);
      console.log('     响应数据:', JSON.stringify(err.response.data));
    }
  }

  // 测试股票池接口
  console.log('\n4. 测试股票池接口: /api/stock-pool');
  
  try {
    const response = await axios.get('http://localhost:3001/api/stock-pool', {
      timeout: 5000
    });
    
    console.log('   ✓ 股票池接口可达，状态码:', response.status);
    console.log('     股票池数量:', response.data?.length || 0);
  } catch (err) {
    console.log('   ✗ 股票池接口失败:');
    console.log('     错误消息:', err.message);
    
    if (err.response) {
      console.log('     响应状态:', err.response.status);
      console.log('     响应数据:', JSON.stringify(err.response.data));
    }
  }

  console.log('\n=== 后端服务测试完成 ===');
}

testBackend().catch(console.error);