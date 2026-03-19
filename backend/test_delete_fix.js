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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testDelete() {
  console.log('=== 测试删除API ===\n');

  try {
    // 1. 先查询数据
    console.log('1. 查询当前数据...');
    const query1 = await sendRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/daily_work_data',
      method: 'GET'
    });
    console.log(`   状态码: ${query1.statusCode}`);
    console.log(`   数据: ${JSON.stringify(query1.data.data.map(d => ({ id: d.id, date: d.date, deleted: d.deleted })))}`);

    if (query1.data.data.length === 0) {
      console.log('   没有数据可测试');
      return;
    }

    const testId = query1.data.data[0].id;
    const testDate = query1.data.data[0].date.split('T')[0];

    console.log(`\n   测试ID: ${testId}, 日期: ${testDate}`);

    // 2. 测试按日期删除（使用正确的日期格式）
    console.log('\n2. 测试按日期删除...');
    const deleteResult = await sendRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/daily_work_data/bulk',
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    }, { dates: [testDate] });
    console.log(`   状态码: ${deleteResult.statusCode}`);
    console.log(`   响应: ${JSON.stringify(deleteResult.data)}`);

    // 3. 删除后查询
    console.log('\n3. 删除后查询...');
    await delay(500);
    const query2 = await sendRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/daily_work_data',
      method: 'GET'
    });
    console.log(`   状态码: ${query2.statusCode}`);
    console.log(`   数据数量: ${query2.data.data.length}`);
    if (query2.data.data.length > 0) {
      console.log(`   数据: ${JSON.stringify(query2.data.data.map(d => ({ id: d.id, date: d.date, deleted: d.deleted })))}`);
    }

    // 4. 测试按ID删除
    console.log('\n4. 测试按ID删除...');
    const deleteByIdResult = await sendRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/daily_work_data/${testId}`,
      method: 'DELETE'
    });
    console.log(`   状态码: ${deleteByIdResult.statusCode}`);
    console.log(`   响应: ${JSON.stringify(deleteByIdResult.data)}`);

    // 5. 删除后查询
    console.log('\n5. 删除后再次查询...');
    await delay(500);
    const query3 = await sendRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/daily_work_data',
      method: 'GET'
    });
    console.log(`   状态码: ${query3.statusCode}`);
    console.log(`   数据数量: ${query3.data.data.length}`);

    console.log('\n=== 测试完成 ===');

  } catch (err) {
    console.error('\n测试失败:', err.message);
  }
}

testDelete();
