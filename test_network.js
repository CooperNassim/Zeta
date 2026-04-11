import axios from 'axios';
import https from 'https';

async function testNetwork() {
  console.log('=== 测试网络连通性 ===\n');

  // 测试 iTick API 基础连接
  const testUrl = 'https://api.itick.org';
  console.log('1. 测试访问 iTick API:', testUrl);
  
  try {
    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    const response = await axios.get(testUrl, {
      timeout: 10000,
      httpsAgent: agent,
      headers: {
        'User-Agent': 'Node.js Test'
      }
    });
    
    console.log('   ✓ iTick API 可达，状态码:', response.status);
  } catch (err) {
    console.log('   ✗ iTick API 连接失败:');
    console.log('     错误类型:', err.constructor.name);
    console.log('     错误消息:', err.message);
    
    if (err.code) {
      console.log('     错误代码:', err.code);
    }
    
    if (err.response) {
      console.log('     响应状态:', err.response.status);
    } else if (err.request) {
      console.log('     请求发出但未收到响应');
    }
  }

  // 测试本地后端服务
  console.log('\n2. 测试后端服务: http://localhost:3001');
  
  try {
    const response = await axios.get('http://localhost:3001', {
      timeout: 5000
    });
    
    console.log('   ✓ 后端服务可达，状态码:', response.status);
  } catch (err) {
    console.log('   ✗ 后端服务连接失败:');
    console.log('     错误消息:', err.message);
    
    if (err.code) {
      console.log('     错误代码:', err.code);
    }
    
    if (err.response) {
      console.log('     响应状态:', err.response.status);
    } else if (err.request) {
      console.log('     请求发出但未收到响应');
    }
  }

  // 测试实际的 iTick API 接口
  console.log('\n3. 测试 iTick 实时行情接口');
  
  try {
    const token = '225630767e444bf389d3eae2842097c9c4195c5ed3de4a41adb0d82a3a9e97b2';
    const response = await axios.get('https://api.itick.org/quote/stock/real-time/SHSE.000001', {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'token': token
      }
    });
    
    console.log('   ✓ iTick API 接口可达，状态码:', response.status);
    console.log('     响应数据:', JSON.stringify(response.data).substring(0, 100) + '...');
  } catch (err) {
    console.log('   ✗ iTick API 接口连接失败:');
    console.log('     错误消息:', err.message);
    
    if (err.response) {
      console.log('     响应状态:', err.response.status);
      console.log('     响应数据:', JSON.stringify(err.response.data));
    }
  }
  
  console.log('\n=== 网络测试完成 ===');
}

testNetwork().catch(console.error);