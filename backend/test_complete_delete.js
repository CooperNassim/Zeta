const http = require('http');

// 工具函数：发送HTTP请求
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

async function testSoftDelete() {
  console.log('=== 软删除功能测试 ===\n');

  try {
    // 1. 查询当前数据
    console.log('1. 查询当前数据...');
    const queryResult = await sendRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/daily_work_data',
      method: 'GET'
    });
    console.log(`   状态码: ${queryResult.statusCode}`);
    console.log(`   数据数量: ${queryResult.data.data.length}`);
    if (queryResult.data.data.length > 0) {
      console.log(`   数据: ${JSON.stringify(queryResult.data.data.map(d => ({ id: d.id, date: d.date, deleted: d.deleted })))}`);
    }

    // 如果没有数据，先创建一条测试数据
    if (queryResult.data.data.length === 0) {
      console.log('\n   没有数据，创建测试数据...');
      const createResult = await sendRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/daily_work_data',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        date: '2026-03-11',
        nasdaq: '测试数据',
        sentiment: '微热',
        prediction: '看涨',
        trade_status: '积极地'
      });
      console.log(`   创建结果: ${JSON.stringify(createResult.data)}`);
      
      // 等待一秒后重新查询
      await delay(1000);
      
      const queryAfterCreate = await sendRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/daily_work_data',
        method: 'GET'
      });
      if (queryAfterCreate.data.data.length > 0) {
        console.log(`   创建后数据: ${JSON.stringify(queryAfterCreate.data.data.map(d => ({ id: d.id, date: d.date, deleted: d.deleted })))}`);
      }
    }

    // 2. 测试删除API（批量删除）
    console.log('\n2. 测试批量删除API...');
    const testDate = '2026-03-11';
    const deleteResult = await sendRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/daily_work_data/bulk',
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    }, { dates: [testDate] });
    console.log(`   状态码: ${deleteResult.statusCode}`);
    console.log(`   响应: ${JSON.stringify(deleteResult.data)}`);

    // 3. 删除后查询数据（应该返回空）
    console.log('\n3. 删除后查询数据...');
    await delay(500);
    const queryAfterDelete = await sendRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/daily_work_data',
      method: 'GET'
    });
    console.log(`   状态码: ${queryAfterDelete.statusCode}`);
    console.log(`   数据数量: ${queryAfterDelete.data.data.length}`);
    if (queryAfterDelete.data.data.length > 0) {
      console.log(`   数据: ${JSON.stringify(queryAfterDelete.data.data.map(d => ({ id: d.id, date: d.date, deleted: d.deleted })))}`);
    }

    // 4. 测试同步API（应该返回空）
    console.log('\n4. 删除后同步数据...');
    const syncResult = await sendRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/sync/all',
      method: 'GET'
    });
    console.log(`   状态码: ${syncResult.statusCode}`);
    const dailyWorkData = syncResult.data.data?.daily_work_data || [];
    console.log(`   每日功课数据数量: ${dailyWorkData.length}`);
    if (dailyWorkData.length > 0) {
      console.log(`   数据: ${JSON.stringify(dailyWorkData.map(d => ({ id: d.id, date: d.date, deleted: d.deleted })))}`);
    }

    // 5. 恢复数据
    console.log('\n5. 恢复数据...');
    const restoreResult = await sendRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/daily_work_data',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      date: '2026-03-11',
      nasdaq: '测试数据恢复',
      sentiment: '微热',
      prediction: '看涨',
      trade_status: '积极地'
    });
    console.log(`   恢复结果: ${JSON.stringify(restoreResult.data)}`);

    console.log('\n=== 测试完成 ===');
    
    // 总结
    console.log('\n总结:');
    if (queryAfterDelete.data.data.length === 0 && dailyWorkData.length === 0) {
      console.log('✓ 软删除功能正常：删除后查询和同步都返回空数据');
    } else {
      console.log('✗ 软删除功能异常：删除后仍然可以查询到数据');
    }

  } catch (err) {
    console.error('\n测试失败:', err.message);
  }
}

testSoftDelete();
