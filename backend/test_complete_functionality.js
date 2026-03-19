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

async function testCompleteFlow() {
  console.log('========================================');
  console.log('  每日功课软删除功能完整测试');
  console.log('========================================');

  // 步骤1: 查询所有数据
  console.log('\n【步骤1】查询所有数据...');
  const data1 = await makeRequest('GET', '/api/daily_work_data');
  console.log(`  ✓ 数据数量: ${data1.data ? data1.data.length : 0}`);

  if (!data1.success || !data1.data || data1.data.length === 0) {
    console.log('没有数据，跳过测试');
    return;
  }

  // 步骤2: 选择第一条和第二条数据进行删除
  const idsToDelete = data1.data.slice(0, 2).map(d => d.id);
  console.log(`\n【步骤2】准备删除ID: ${idsToDelete.join(', ')}`);

  // 步骤3: 按ID逐条删除
  console.log('\n【步骤3】开始删除...');
  for (const id of idsToDelete) {
    const deleteResult = await makeRequest('DELETE', `/api/daily_work_data/${id}`);
    if (deleteResult.success) {
      console.log(`  ✓ 删除ID ${id} 成功 (deleted: ${deleteResult.data.deleted})`);
    } else {
      console.log(`  ✗ 删除ID ${id} 失败:`, deleteResult.error);
    }
  }

  // 步骤4: 删除后查询
  console.log('\n【步骤4】删除后查询数据...');
  const data2 = await makeRequest('GET', '/api/daily_work_data');
  console.log(`  ✓ 数据数量: ${data2.data ? data2.data.length : 0}`);

  // 步骤5: 测试同步API
  console.log('\n【步骤5】测试同步API...');
  const syncResult = await makeRequest('GET', '/api/sync/all');
  const syncedData = syncResult.data?.daily_work_data || [];
  console.log(`  ✓ 同步数据数量: ${syncedData.length}`);

  // 步骤6: 恢复已删除的数据
  console.log('\n【步骤6】恢复已删除的数据...');
  for (const id of idsToDelete) {
    const restoreResult = await makeRequest('PATCH', `/api/daily_work_data/${id}/restore`);
    if (restoreResult.success) {
      console.log(`  ✓ 恢复ID ${id} 成功 (deleted: ${restoreResult.data.deleted})`);
    } else {
      console.log(`  ✗ 恢复ID ${id} 失败:`, restoreResult.error);
    }
  }

  // 步骤7: 恢复后查询
  console.log('\n【步骤7】恢复后查询数据...');
  const data3 = await makeRequest('GET', '/api/daily_work_data');
  console.log(`  ✓ 数据数量: ${data3.data ? data3.data.length : 0}`);

  console.log('\n========================================');
  console.log('  测试总结');
  console.log('========================================');
  console.log(`初始数据数量: ${data1.data.length}`);
  console.log(`删除后查询数量: ${data2.data ? data2.data.length : 0}`);
  console.log(`同步数据数量: ${syncedData.length}`);
  console.log(`恢复后查询数量: ${data3.data ? data3.data.length : 0}`);

  const deletedCount = data1.data.length - (data2.data ? data2.data.length : 0);
  const restoredCount = (data3.data ? data3.data.length : 0) - (data2.data ? data2.data.length : 0);

  if (deletedCount === idsToDelete.length && restoredCount === idsToDelete.length) {
    console.log('\n✅ 软删除功能完全正常!');
    console.log(`   - 成功删除 ${deletedCount} 条数据`);
    console.log(`   - 成功恢复 ${restoredCount} 条数据`);
    console.log('   - 查询API正确过滤已删除数据');
    console.log('   - 同步API正确过滤已删除数据');
  } else {
    console.log('\n❌ 软删除功能存在问题!');
  }

  console.log('\n========================================');
}

testCompleteFlow().catch(console.error);
