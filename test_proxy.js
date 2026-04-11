import axios from 'axios';

async function testProxy() {
  console.log('=== 测试iTick代理功能 ===\n');

  // 测试单只股票代理
  console.log('1. 测试单只股票代理');
  try {
    const response = await axios.get('http://localhost:3001/api/proxy/itick/stock/quote', {
      params: {
        region: 'SZ',
        code: '301563'
      },
      timeout: 10000
    });
    
    console.log('   ✓ 代理请求成功，状态码:', response.status);
    console.log('     响应数据:', JSON.stringify(response.data).substring(0, 200) + '...');
  } catch (err) {
    console.log('   ✗ 代理请求失败:');
    console.log('     错误消息:', err.response?.data?.message || err.message);
    if (err.response?.data?.error) {
      console.log('     错误类型:', err.response.data.error);
    }
  }

  // 测试批量股票代理
  console.log('\n2. 测试批量股票代理');
  try {
    const response = await axios.get('http://localhost:3001/api/proxy/itick/batch-quotes', {
      params: {
        symbols: '000001,600000,830001'
      },
      timeout: 10000
    });
    
    console.log('   ✓ 批量代理成功，状态码:', response.status);
    console.log('     响应数据长度:', JSON.stringify(response.data).length, '字符');
  } catch (err) {
    console.log('   ✗ 批量代理失败:');
    console.log('     错误消息:', err.response?.data?.message || err.message);
    if (err.response?.data?.error) {
      console.log('     错误类型:', err.response.data.error);
    }
  }

  // 测试iTick API基础路径
  console.log('\n3. 测试iTick基础路径代理');
  try {
    const response = await axios.get('http://localhost:3001', {
      timeout: 5000
    });
    console.log('   ✓ 后端服务可达，状态码:', response.status);
  } catch (err) {
    console.log('   ✗ 后端服务不可达:');
    console.log('     错误消息:', err.message);
  }

  console.log('\n=== 代理功能测试完成 ===');
}

testProxy().catch(console.error);