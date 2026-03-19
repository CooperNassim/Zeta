const http = require('http');

// 测试不同的路由
const tests = [
  { path: '/api/daily_work_data', method: 'GET', desc: '查询所有数据' },
  { path: '/api/daily_work_data/bulk/delete', method: 'POST', desc: '批量删除(POST)' },
];

async function testRoute(test) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: test.path,
      method: test.method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n[${test.desc}] ${test.method} ${test.path}`);
        console.log(`  状态码: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log(`  响应:`, json);
        } catch(e) {
          console.log(`  响应: ${data}`);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`\n[${test.desc}] 错误: ${err.message}`);
      resolve();
    });

    // POST请求发送空body
    if (test.method === 'POST') {
      req.write(JSON.stringify({ dates: [] }));
    }

    req.end();
  });
}

async function runTests() {
  console.log('========================================');
  console.log('  测试API路由是否可访问');
  console.log('========================================');

  for (const test of tests) {
    await testRoute(test);
  }
}

runTests().catch(console.error);
