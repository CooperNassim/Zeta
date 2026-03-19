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

async function testDeleteFlow() {
  console.log('========================================');
  console.log('  每日功课软删除功能测试');
  console.log('========================================');

  // 步骤1: 查询所有数据
  console.log('\n【步骤1】查询所有数据...');
  const data1 = await makeRequest('GET', '/api/daily_work_data');
  console.log(`  ✓ 数据数量: ${data1.data ? data1.data.length : 0}`);

  if (!data1.success || !data1.data || data1.data.length === 0) {
    console.log('没有数据，跳过测试');
    return;
  }

  // 步骤2: 选择第一条数据进行删除
  const idToDelete = data1.data[0].id;
  console.log(`\n【步骤2】准备删除ID: ${idToDelete}`);
  console.log(`  删除前: date=${data1.data[0].date}, deleted=${data1.data[0].deleted}`);

  // 步骤3: 按ID删除
  console.log('\n【步骤3】执行删除...');
  const deleteResult = await makeRequest('DELETE', `/api/daily_work_data/${idToDelete}`);
  console.log(`  ✓ 删除结果: ${deleteResult.success ? '成功' : '失败'}`);
  if (deleteResult.success) {
    console.log(`  ✓ deleted字段: ${deleteResult.data.deleted}`);
    console.log(`  ✓ deleted_at字段: ${deleteResult.data.deleted_at}`);
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

  // 步骤6: 再次查询所有数据（包括已删除的）
  console.log('\n【步骤6】查询所有数据（包括已删除）...');
  const allData = await makeRequest('GET', '/api/daily_work_data?includeDeleted=true');
  console.log(`  ✓ 所有数据数量: ${allData.data ? allData.data.length : 0}`);
  if (allData.data && allData.data.length > 0) {
    const deletedItem = allData.data.find(d => d.id === idToDelete);
    if (deletedItem) {
      console.log(`  ✓ 已删除项仍存在于数据库: date=${deletedItem.date}, deleted=${deletedItem.deleted}`);
    }
  }

  console.log('\n========================================');
  console.log('  测试总结');
  console.log('========================================');
  console.log(`初始数据数量: ${data1.data.length}`);
  console.log(`删除后查询数量: ${data2.data ? data2.data.length : 0}`);
  console.log(`同步数据数量: ${syncedData.length}`);
  console.log(`所有数据数量(包括已删除): ${allData.data ? allData.data.length : 0}`);

  const isDeletedProperly =
    data2.data && data2.data.length < data1.data.length &&
    syncedData.length < data1.data.length &&
    allData.data && allData.data.length === data1.data.length;

  if (isDeletedProperly) {
    console.log('\n✅ 软删除功能完全正常!');
    console.log('   - 删除后数据从查询结果中消失');
    console.log('   - 同步API正确过滤已删除数据');
    console.log('   - 数据仍存在于数据库中（软删除）');
  } else {
    console.log('\n❌ 软删除功能可能存在问题!');
  }

  console.log('\n========================================');
}

testDeleteFlow().catch(console.error);
