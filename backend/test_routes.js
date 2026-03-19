const http = require('http');

const sendRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

async function testRoutes() {
  console.log('=== 测试路由匹配 ===\n');

  try {
    // 测试不同的路由
    const tests = [
      {
        name: '按ID删除',
        path: '/api/daily_work_data/2',
        method: 'DELETE',
        body: null
      },
      {
        name: '按日期删除(bulk)',
        path: '/api/daily_work_data/bulk',
        method: 'DELETE',
        body: { dates: ['2026-03-10'] }
      },
      {
        name: '按ID数组删除(bulk)',
        path: '/api/daily_work_data/bulk',
        method: 'DELETE',
        body: { ids: [2] }
      }
    ];

    for (const test of tests) {
      console.log(`\n测试: ${test.name}`);
      console.log(`路径: ${test.path}`);
      console.log(`方法: ${test.method}`);
      console.log(`请求体: ${JSON.stringify(test.body)}`);

      const options = {
        hostname: 'localhost',
        port: 3001,
        path: test.path,
        method: test.method,
        headers: test.body ? { 'Content-Type': 'application/json' } : {}
      };

      const result = await sendRequest(options, test.body);
      console.log(`状态码: ${result.statusCode}`);
      console.log(`响应: ${JSON.stringify(result.data)}`);
    }

  } catch (err) {
    console.error('测试失败:', err.message);
  }
}

testRoutes();
