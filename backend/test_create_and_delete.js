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

async function testCreateAndDelete() {
  console.log('========================================');
  console.log('  测试创建和删除功能');
  console.log('========================================');

  // 步骤1: 查询初始数据
  console.log('\n【步骤1】查询初始数据...');
  const data1 = await makeRequest('GET', '/api/daily_work_data');
  console.log(`  ✓ 数据数量: ${data1.data ? data1.data.length : 0}`);
  const initialCount = data1.data ? data1.data.length : 0;

  // 步骤2: 创建新数据
  console.log('\n【步骤2】创建新数据...');
  const newDate = '2026-03-16';
  const createData = {
    date: newDate,
    nasdaq: '测试创建',
    sentiment: '微热',
    prediction: '看涨',
    trade_status: '积极地'
  };
  const createResult = await makeRequest('POST', '/api/daily_work_data', createData);
  console.log(`  ✓ 创建结果: ${createResult.success ? '成功' : '失败'}`);
  if (createResult.success) {
    console.log(`  ✓ 新数据ID: ${createResult.data?.id}`);
    console.log(`  ✓ 新数据日期: ${createResult.data?.date}`);
  }

  // 步骤3: 创建后查询
  console.log('\n【步骤3】创建后查询数据...');
  const data2 = await makeRequest('GET', '/api/daily_work_data');
  console.log(`  ✓ 数据数量: ${data2.data ? data2.data.length : 0}`);
  const afterCreateCount = data2.data ? data2.data.length : 0;
  console.log(`  ✓ 数据数量变化: ${initialCount} → ${afterCreateCount}`);

  // 步骤4: 验证新数据存在
  console.log('\n【步骤4】验证新数据是否存在...');
  const newExists = data2.data?.find(d => d.date === newDate);
  console.log(`  ✓ 新数据是否存在: ${newExists ? '是' : '否'}`);

  // 步骤5: 测试同步API
  console.log('\n【步骤5】测试同步API...');
  const syncResult = await makeRequest('GET', '/api/sync/all');
  const syncedData = syncResult.data?.daily_work_data || [];
  console.log(`  ✓ 同步数据数量: ${syncedData.length}`);
  const syncedNewExists = syncedData.find(d => d.date === newDate);
  console.log(`  ✓ 同步数据中是否存在新数据: ${syncedNewExists ? '是' : '否'}`);

  // 步骤6: 删除新数据
  console.log('\n【步骤6】删除新数据...');
  if (createResult.success && createResult.data?.id) {
    const deleteResult = await makeRequest('DELETE', `/api/daily_work_data/${createResult.data.id}`);
    console.log(`  ✓ 删除结果: ${deleteResult.success ? '成功' : '失败'}`);
    if (deleteResult.success) {
      console.log(`  ✓ deleted字段: ${deleteResult.data.deleted}`);
    }
  }

  // 步骤7: 删除后查询
  console.log('\n【步骤7】删除后查询数据...');
  const data3 = await makeRequest('GET', '/api/daily_work_data');
  console.log(`  ✓ 数据数量: ${data3.data ? data3.data.length : 0}`);

  console.log('\n========================================');
  console.log('  测试总结');
  console.log('========================================');
  console.log(`初始数据数量: ${initialCount}`);
  console.log(`创建后数据数量: ${afterCreateCount}`);
  console.log(`删除后数据数量: ${data3.data ? data3.data.length : 0}`);

  const tests = {
    '创建成功': createResult.success,
    '创建后数据数量增加': afterCreateCount === initialCount + 1,
    '新数据存在于查询结果中': !!newExists,
    '同步API包含新数据': !!syncedNewExists,
    '删除成功': createResult.success && createResult.data?.id ? true : false,
    '删除后数据数量减少': (data3.data ? data3.data.length : 0) === initialCount
  };

  console.log('\n测试结果:');
  for (const [name, passed] of Object.entries(tests)) {
    console.log(`  ${passed ? '✅' : '❌'} ${name}`);
  }

  const allPassed = Object.values(tests).every(v => v === true);
  if (allPassed) {
    console.log('\n✅ 创建和删除功能完全正常!');
  } else {
    console.log('\n❌ 创建或删除功能可能存在问题!');
  }

  console.log('\n========================================');
}

testCreateAndDelete().catch(console.error);
