const http = require('http');

async function testById() {
  console.log('========================================');
  console.log('  测试按ID删除');
  console.log('========================================');

  // 步骤1: 查询数据
  console.log('\n【步骤1】查询数据...');
  const data1 = await makeRequest('GET', '/api/daily_work_data');
  console.log('数据:', JSON.stringify(data1, null, 2));

  if (!data1.success || !data1.data || data1.data.length === 0) {
    console.log('没有数据，跳过测试');
    return;
  }

  const testId = data1.data[0].id;
  console.log('测试数据ID:', testId);

  // 步骤2: 按ID删除
  console.log('\n【步骤2】按ID删除...');
  const deleteResult = await makeRequest('DELETE', `/api/daily_work_data/${testId}`);
  console.log('删除结果:', deleteResult);

  // 步骤3: 删除后查询
  console.log('\n【步骤3】删除后查询...');
  const data2 = await makeRequest('GET', '/api/daily_work_data');
  console.log('数据数量:', data2.data ? data2.data.length : 0);
  console.log('数据:', JSON.stringify(data2, null, 2));

  // 步骤4: 测试同步API
  console.log('\n【步骤4】测试同步API...');
  const syncResult = await makeRequest('GET', '/api/sync/all');
  console.log('同步数据:', JSON.stringify(syncResult.data?.daily_work_data, null, 2));

  console.log('\n========================================');
  console.log('  测试总结');
  console.log('========================================');
  console.log('初始数据数量:', data1.data.length);
  console.log('删除后查询数量:', data2.data ? data2.data.length : 0);
  console.log('同步数据数量:', syncResult.data?.daily_work_data?.length || 0);

  if (data2.data && data2.data.length < data1.data.length) {
    console.log('✅ 软删除功能正常!');
  } else {
    console.log('❌ 软删除功能可能存在问题!');
  }
}

function makeRequest(method, path, body = null) {
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

testById().catch(console.error);
