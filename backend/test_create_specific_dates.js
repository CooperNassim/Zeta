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
  console.log('========================================');
  console.log('  测试创建不同日期的数据');
  console.log('========================================');

  // 清空测试数据
  console.log('\n【步骤0】清空测试数据...');
  await makeRequest('DELETE', '/api/daily_work_data/bulk/permanent', {
    ids: await getAllIds()
  });

  // 测试1: 创建3月1日的数据
  console.log('\n【测试1】创建3月1日的数据...');
  const date1 = '2026-03-01';
  const result1 = await createAndTest(date1);
  console.log(result1);

  // 测试2: 创建3月16日的数据
  console.log('\n【测试2】创建3月16日的数据...');
  const date2 = '2026-03-16';
  const result2 = await createAndTest(date2);
  console.log(result2);

  // 测试3: 创建3月31日的数据
  console.log('\n【测试3】创建3月31日的数据...');
  const date3 = '2026-03-31';
  const result3 = await createAndTest(date3);
  console.log(result3);
}

async function getAllIds() {
  const result = await makeRequest('GET', '/api/daily_work_data?includeDeleted=true');
  return result.data?.map(d => d.id) || [];
}

async function createAndTest(date) {
  const createData = {
    date: date,
    nasdaq: `测试${date}`,
    sentiment: '微热',
    prediction: '看涨',
    trade_status: '积极地'
  };

  // 创建
  const createResult = await makeRequest('POST', '/api/daily_work_data', createData);
  console.log(`  创建结果: ${createResult.success ? '成功' : '失败'}`);

  if (!createResult.success) {
    return { error: '创建失败', details: createResult };
  }

  console.log(`  返回的日期: ${createResult.data?.date}`);
  console.log(`  返回的ID: ${createResult.data?.id}`);

  // 查询所有数据
  const queryResult = await makeRequest('GET', '/api/daily_work_data');
  console.log(`  查询到的数据数量: ${queryResult.data?.length || 0}`);

  // 检查数据是否存在
  const found = queryResult.data?.find(d => {
    // 处理日期比较
    const d1 = new Date(d.date).toLocaleDateString('zh-CN');
    const d2 = new Date(date).toLocaleDateString('zh-CN');
    console.log(`    比较: ${d.date} (${d1}) vs ${date} (${d2}) - 相同: ${d1 === d2}`);
    return d1 === d2;
  });

  console.log(`  数据是否存在: ${found ? '是' : '否'}`);

  // 显示所有数据的日期
  console.log(`  所有数据的日期:`);
  queryResult.data?.forEach(d => {
    console.log(`    - ${d.date} (${new Date(d.date).toLocaleDateString('zh-CN')})`);
  });

  return {
    success: !!found,
    returnedDate: createResult.data?.date,
    foundDate: found?.date,
    totalRecords: queryResult.data?.length
  };
}

test().catch(console.error);
