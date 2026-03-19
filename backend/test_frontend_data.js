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
  console.log('=== 测试前端发送的完整数据 ===\n');

  // 清理
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
      await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: `/api/daily_work_data/${march31.id}`,
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 模拟前端发送的完整数据（包含 created_at 和 updated_at）
  const now = new Date().toISOString();
  const frontendData = {
    date: '2026-03-31',
    nasdaq: '100',
    ftse: null,
    dax: null,
    n225: null,
    hsi: null,
    bitcoin: null,
    eurusd: null,
    usdjpy: null,
    usdcny: null,
    oil: null,
    gold: null,
    bond: null,
    consecutive: null,
    a50: null,
    sh_index: null,
    sh_2day_power: null,
    sh_13day_power: null,
    up_count: null,
    limit_up: null,
    down_count: null,
    limit_down: null,
    volume: null,
    sentiment: '微热',
    prediction: '看涨',
    trade_status: '积极地',
    review_plan: null,
    review_execution: null,
    review_result: null,
    deleted: false,
    deleted_at: null,
    created_at: now,
    updated_at: now
  };

  console.log('【创建】发送前端完整数据');
  console.log('  date:', frontendData.date);
  console.log('  nasdaq:', frontendData.nasdaq);
  console.log('  包含 created_at:', !!frontendData.created_at);

  let result = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/daily_work_data',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, frontendData);

  if (!result.success) {
    console.log('  ❌ 请求失败:', result.error);
    return;
  }

  if (!result.data.success) {
    console.log('  ❌ 创建失败:', result.data.error);
    return;
  }

  console.log('  ✅ 创建成功');
  console.log('  ID:', result.data.data.id);

  const createdId = result.data.data.id;

  // 删除
  console.log('\n【删除】');
  await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: `/api/daily_work_data/${createdId}`,
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  console.log('  ✅ 删除成功');

  // 重新创建
  console.log('\n【重新创建】发送前端完整数据');
  const recreateData = { ...frontendData, nasdaq: '200', sentiment: '过热' };

  result = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/daily_work_data',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, recreateData);

  if (!result.success) {
    console.log('  ❌ 重新创建失败:', result.error);
    console.log('\n❌ 最终失败');
    return;
  }

  if (!result.data.success) {
    console.log('  ❌ 重新创建失败:', result.data.error);
    console.log('\n❌ 最终失败');
    return;
  }

  console.log('  ✅ 重新创建成功');
  console.log('  ID:', result.data.data.id);
  console.log('  nasdaq:', result.data.data.nasdaq);

  // 验证
  console.log('\n【验证】查询数据');
  data = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/daily_work_data',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (data.success && data.data.success) {
    const found = data.data.data.find(d => d.date === '2026-03-31');
    if (found && found.nasdaq === '200' && found.sentiment === '过热') {
      console.log('  ✅ 数据正确');
      console.log('\n✅✅✅ 成功！前端发送的完整数据也能正常工作');
    } else {
      console.log('  ❌ 数据不正确');
    }
  }
}

test();
