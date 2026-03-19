const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ success: true, statusCode: res.statusCode, data: result });
        } catch (e) {
          resolve({ success: false, statusCode: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  console.log('=== 真实操作测试：删除后重新创建3月31日数据 ===\n');

  // 步骤1：清理所有3月31日的数据
  console.log('【步骤1】清理所有3月31日的数据');
  let data = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/daily_work_data',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (data.success && data.data.success) {
    const march31 = data.data.data.find(d => d.date === '2026-03-31');
    if (march31) {
      console.log('  找到3月31日数据，ID:', march31.id);
      await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: `/api/daily_work_data/${march31.id}`,
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('  已删除');
    } else {
      console.log('  未找到3月31日数据');
    }
  }

  // 步骤2：创建3月31日数据
  console.log('\n【步骤2】创建3月31日数据');
  const createData = {
    date: '2026-03-31',
    nasdaq: '100',
    sentiment: '微热',
    prediction: '看涨',
    trade_status: '积极地'
  };

  let createResult = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/daily_work_data',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, createData);

  if (!createResult.success) {
    console.log('  ❌ 创建失败:', createResult.error || createResult.raw);
    return;
  }

  if (!createResult.data.success) {
    console.log('  ❌ 创建失败:', createResult.data.error);
    return;
  }

  console.log('  ✅ 创建成功');
  console.log('  ID:', createResult.data.data.id);
  console.log('  date:', createResult.data.data.date);

  // 步骤3：查询数据验证
  console.log('\n【步骤3】查询数据验证创建结果');
  data = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/daily_work_data',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (data.success && data.data.success) {
    const found = data.data.data.find(d => d.date === '2026-03-31');
    if (found) {
      console.log('  ✅ 找到3月31日数据');
      console.log('  nasdaq:', found.nasdaq);
    } else {
      console.log('  ❌ 未找到3月31日数据');
      console.log('  所有日期:', data.data.data.map(d => d.date).join(', '));
    }
  }

  const createdId = createResult.data.data.id;

  // 步骤4：删除数据
  console.log('\n【步骤4】删除数据');
  let deleteResult = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: `/api/daily_work_data/${createdId}`,
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!deleteResult.success) {
    console.log('  ❌ 删除失败:', deleteResult.error);
    return;
  }

  console.log('  ✅ 删除成功');

  // 步骤5：查询验证删除
  console.log('\n【步骤5】查询验证删除结果');
  data = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/daily_work_data',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (data.success && data.data.success) {
    const found = data.data.data.find(d => d.date === '2026-03-31');
    if (!found) {
      console.log('  ✅ 确认：3月31日数据已删除，不在列表中');
    } else {
      console.log('  ❌ 错误：删除后仍然找到数据');
    }
  }

  // 步骤6：重新创建3月31日数据
  console.log('\n【步骤6】重新创建3月31日数据');
  const recreateData = {
    date: '2026-03-31',
    nasdaq: '200',
    sentiment: '过热',
    prediction: '看涨',
    trade_status: '积极地'
  };

  let recreateResult = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/daily_work_data',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, recreateData);

  if (!recreateResult.success) {
    console.log('  ❌ 重新创建失败:', recreateResult.error || recreateResult.raw);
    console.log('\n❌❌❌ 最终失败：删除后无法重新创建');
    return;
  }

  if (!recreateResult.data.success) {
    console.log('  ❌ 重新创建失败:', recreateResult.data.error);
    console.log('\n❌❌❌ 最终失败：删除后无法重新创建');
    return;
  }

  console.log('  ✅ 重新创建成功');
  console.log('  ID:', recreateResult.data.data.id);
  console.log('  date:', recreateResult.data.data.date);
  console.log('  nasdaq:', recreateResult.data.data.nasdaq);

  // 步骤7：查询验证重新创建
  console.log('\n【步骤7】查询验证重新创建结果');
  data = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/daily_work_data',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (data.success && data.data.success) {
    const found = data.data.data.find(d => d.date === '2026-03-31');
    if (found) {
      console.log('  ✅ 找到3月31日数据');
      console.log('  nasdaq:', found.nasdaq);
      console.log('  sentiment:', found.sentiment);

      if (found.nasdaq === '200' && found.sentiment === '过热') {
        console.log('\n✅✅✅ 最终成功：删除后可以重新创建且内容正确！');
      } else {
        console.log('\n❌ 内容不正确，期望 nasdaq=200');
      }
    } else {
      console.log('  ❌ 未找到3月31日数据');
      console.log('  所有日期:', data.data.data.map(d => d.date).join(', '));
      console.log('\n❌❌❌ 最终失败：重新创建后不显示');
    }
  }
}

test();
