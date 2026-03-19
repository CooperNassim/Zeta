const http = require('http');

async function testAPI() {
  console.log('=== 测试后端API连接 ===\n');

  const endpoints = [
    { path: '/health', method: 'GET', desc: '健康检查' },
    { path: '/api/daily_work_data', method: 'GET', desc: '获取每日功课数据' },
    { path: '/api/sync/all', method: 'GET', desc: '同步所有数据' }
  ];

  for (const endpoint of endpoints) {
    console.log(`测试: ${endpoint.desc}`);
    console.log(`  方法: ${endpoint.method}`);
    console.log(`  路径: ${endpoint.path}`);

    try {
      const result = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: endpoint.path,
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' }
      });

      if (result.success) {
        console.log(`  ✅ 成功`);
      } else {
        console.log(`  ❌ 失败:`, result.error);
      }
    } catch (error) {
      console.log(`  ❌ 错误:`, error.message);
    }
    console.log();
  }
}

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          resolve({ success: false, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

testAPI();
