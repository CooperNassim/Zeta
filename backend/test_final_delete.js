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

async function testCompleteFlow() {
  console.log('========================================');
  console.log('  每日功课软删除功能完整测试');
  console.log('========================================\n');

  try {
    // 步骤1: 查询初始数据
    console.log('【步骤1】查询初始数据...');
    const query1 = await sendRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/daily_work_data',
      method: 'GET'
    });
    console.log(`  ✓ 状态码: ${query1.statusCode}`);
    console.log(`  ✓ 数据数量: ${query1.data.data.length}`);

    if (query1.data.data.length === 0) {
      console.log('  ⚠ 没有数据,先创建测试数据...\n');

      // 创建测试数据
      const createResult = await sendRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/daily_work_data',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        date: '2026-03-11',
        nasdaq: '17500',
        sentiment: '微热',
        prediction: '看涨',
        trade_status: '积极地'
      });
      console.log(`  ✓ 创建结果: ${createResult.data.success ? '成功' : '失败'}`);

      await delay(500);

      // 重新查询
      const queryAfterCreate = await sendRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/daily_work_data',
        method: 'GET'
      });
      console.log(`  ✓ 创建后数据数量: ${queryAfterCreate.data.data.length}\n`);
    }

    // 步骤2: 再次查询,获取要测试的数据
    console.log('【步骤2】查询可删除的数据...');
    const query2 = await sendRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/daily_work_data',
      method: 'GET'
    });
    console.log(`  ✓ 当前数据数量: ${query2.data.data.length}`);

    if (query2.data.data.length === 0) {
      console.log('  ⚠ 没有可删除的数据\n');
      return;
    }

    const testData = query2.data.data[0];
    const testDate = testData.date.split('T')[0];
    const testId = testData.id;

    console.log(`  ✓ 测试数据: ID=${testId}, 日期=${testDate}, deleted=${testData.deleted}\n`);

    // 步骤3: 测试按日期批量删除
    console.log('【步骤3】测试按日期批量删除...');
    const deleteResult = await sendRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/daily_work_data/bulk/delete',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { dates: [testDate] });
    console.log(`  ✓ 状态码: ${deleteResult.statusCode}`);
    console.log(`  ✓ 删除结果: ${JSON.stringify(deleteResult.data)}`);

    if (deleteResult.statusCode === 200 && deleteResult.data.success) {
      console.log(`  ✓ 成功删除 ${deleteResult.data.count} 条数据\n`);
    } else {
      console.log(`  ✗ 删除失败: ${JSON.stringify(deleteResult.data)}\n`);
    }

    // 步骤4: 删除后查询(应该返回空或已删除的数据不显示)
    console.log('【步骤4】删除后查询数据...');
    await delay(500);
    const query3 = await sendRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/daily_work_data',
      method: 'GET'
    });
    console.log(`  ✓ 状态码: ${query3.statusCode}`);
    console.log(`  ✓ 数据数量: ${query3.data.data.length}`);
    console.log(`  ✓ 数据: ${JSON.stringify(query3.data.data.map(d => ({ id: d.id, date: d.date, deleted: d.deleted })))}`);

    // 步骤5: 测试同步API
    console.log('\n【步骤5】测试同步API...');
    const syncResult = await sendRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/sync/all',
      method: 'GET'
    });
    console.log(`  ✓ 状态码: ${syncResult.statusCode}`);
    const dailyWorkData = syncResult.data.data?.daily_work_data || [];
    console.log(`  ✓ 同步的每日功课数据数量: ${dailyWorkData.length}`);
    if (dailyWorkData.length > 0) {
      console.log(`  ✓ 数据: ${JSON.stringify(dailyWorkData.map(d => ({ id: d.id, date: d.date, deleted: d.deleted })))}`);
    }

    // 步骤6: 总结
    console.log('\n========================================');
    console.log('  测试总结');
    console.log('========================================');

    const initialCount = query2.data.data.length;
    const finalCount = query3.data.data.length;
    const syncCount = dailyWorkData.length;

    console.log(`\n初始数据数量: ${initialCount}`);
    console.log(`删除后查询数量: ${finalCount}`);
    console.log(`同步数据数量: ${syncCount}`);

    if (finalCount < initialCount && finalCount === syncCount) {
      console.log('\n✅ 软删除功能正常!');
      console.log('   - 删除后查询数据减少');
      console.log('   - 同步API正确过滤已删除数据');
    } else if (finalCount === 0 && syncCount === 0) {
      console.log('\n✅ 软删除功能正常!');
      console.log('   - 所有数据已删除,查询返回空');
    } else {
      console.log('\n❌ 软删除功能可能存在问题!');
      console.log(`   - 删除后数据数量: ${finalCount}`);
      console.log(`   - 同步数据数量: ${syncCount}`);
    }

    console.log('\n========================================\n');

  } catch (err) {
    console.error('\n❌ 测试失败:', err.message);
    console.error(err.stack);
  }
}

testCompleteFlow();
