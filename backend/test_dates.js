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

async function testDate(date) {
  console.log(`\n测试日期: ${date}`);

  const createData = {
    date: date,
    nasdaq: `测试${date}`,
    sentiment: '微热',
    prediction: '看涨',
    trade_status: '积极地'
  };

  // 创建
  const createResult = await makeRequest('POST', '/api/daily_work_data', createData);
  console.log(`  创建: ${createResult.success ? '成功' : '失败'}`);
  console.log(`  返回日期: ${createResult.data?.date}`);

  if (!createResult.success) {
    console.log(`  错误: ${createResult.error}`);
    return;
  }

  // 查询
  const queryResult = await makeRequest('GET', '/api/daily_work_data');
  console.log(`  查询到的数据数量: ${queryResult.data?.length || 0}`);

  // 查找数据
  const found = queryResult.data?.find(d => {
    const d1 = new Date(d.date).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const d2 = new Date(date).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
    return d1 === d2;
  });

  console.log(`  数据是否找到: ${found ? '是' : '否'}`);
  if (found) {
    console.log(`  找到的日期: ${found.date}`);
  }
}

async function runTests() {
  console.log('========================================');
  console.log('  测试不同日期的数据创建');
  console.log('========================================');

  await testDate('2026-03-01');
  await testDate('2026-03-16');
  await testDate('2026-03-31');
}

runTests().catch(console.error);
