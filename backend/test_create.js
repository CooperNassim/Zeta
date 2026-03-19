const http = require('http');

async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ success: false, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function test() {
  // 创建数据
  const createData = {
    date: '2026-03-17',
    nasdaq: '测试数据',
    sentiment: '微热',
    prediction: '看涨',
    trade_status: '积极地'
  };
  const createResult = await makeRequest('POST', '/api/daily_work_data', createData);
  console.log('创建结果:', createResult);

  // 查询数据
  const queryResult = await makeRequest('GET', '/api/daily_work_data');
  console.log('\n查询结果:', JSON.stringify(queryResult, null, 2));
}

test().catch(console.error);
