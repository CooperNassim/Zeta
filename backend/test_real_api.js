const http = require('http');

// 清理数据
async function cleanup() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/sync/all',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };

  const syncData = await makeRequest(options);

  if (syncData.success && syncData.data.daily_work_data) {
    const march31 = syncData.data.daily_work_data.find(d => d.date === '2026-03-31');
    if (march31) {
      console.log('[清理] 删除已存在的3月31日数据，ID:', march31.id);
      const deleteOptions = {
        hostname: 'localhost',
        port: 3001,
        path: `/api/daily_work_data/${march31.id}`,
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      };
      await makeRequest(deleteOptions);
    }
  }
}

// 创建数据（模拟前端新增）
async function createData() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/daily_work_data',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  const data = {
    date: '2026-03-31',
    nasdaq: '100',
    sentiment: '微热',
    prediction: '看涨',
    trade_status: '积极地',
    deleted: false
  };

  console.log('\n【步骤1】模拟前端点击新增按钮');
  console.log('[前端] 发送 POST /api/daily_work_data');
  console.log('[前端] 数据:', JSON.stringify(data));

  const result = await makeRequest(options, JSON.stringify(data));
  console.log('[后端] 返回:', result.success ? '成功' : '失败');
  if (!result.success) {
    console.log('[后端] 错误:', result.error);
  }
  if (result.success && result.data) {
    console.log('[后端] ID:', result.data.id);
    console.log('[后端] date:', result.data.date);
  }
  return result;
}

// 查询数据（模拟前端同步）
async function queryData() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/daily_work_data',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };

  console.log('\n【步骤2】模拟前端同步数据');
  console.log('[前端] 发送 GET /api/daily_work_data');

  const result = await makeRequest(options);
  console.log('[后端] 返回数据总数:', result.data.length);

  if (result.success) {
    const march31 = result.data.find(d => d.date === '2026-03-31');
    if (march31) {
      console.log('✅ 找到2026-03-31数据');
      console.log('   nasdaq:', march31.nasdaq);
    } else {
      console.log('❌ 未找到2026-03-31数据');
      console.log('   所有日期:', result.data.map(d => d.date).join(', '));
    }
  }
  return result;
}

// 删除数据（模拟前端删除）
async function deleteData(id) {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/daily_work_data/${id}`,
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  };

  console.log('\n【步骤3】模拟前端点击删除按钮');
  console.log('[前端] 发送 DELETE /api/daily_work_data/' + id);

  const result = await makeRequest(options);
  console.log('[后端] 返回:', result.success ? '成功' : '失败');
  return result;
}

// 重新创建数据（模拟前端再次新增）
async function recreateData() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/daily_work_data',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  const data = {
    date: '2026-03-31',
    nasdaq: '200',
    sentiment: '过热',
    prediction: '看涨',
    trade_status: '积极地',
    deleted: false
  };

  console.log('\n【步骤4】模拟前端再次点击新增按钮');
  console.log('[前端] 发送 POST /api/daily_work_data');
  console.log('[前端] 数据:', JSON.stringify(data));

  const result = await makeRequest(options, JSON.stringify(data));
  console.log('[后端] 返回:', result.success ? '成功' : '失败');
  if (result.success) {
    console.log('[后端] ID:', result.data.id);
    console.log('[后端] date:', result.data.date);
    console.log('[后端] nasdaq:', result.data.nasdaq);
  }
  return result;
}

// 验证数据
async function verifyData() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/daily_work_data',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };

  console.log('\n【步骤5】模拟前端同步数据（验证）');
  console.log('[前端] 发送 GET /api/daily_work_data');

  const result = await makeRequest(options);
  console.log('[后端] 返回数据总数:', result.data.length);

  if (result.success) {
    const march31 = result.data.find(d => d.date === '2026-03-31');
    if (march31) {
      console.log('✅ 找到2026-03-31数据');
      console.log('   nasdaq:', march31.nasdaq);
      console.log('   sentiment:', march31.sentiment);

      if (march31.nasdaq === '200') {
        console.log('\n✅✅✅ 成功！重新创建后可以显示且内容正确');
      } else {
        console.log('\n❌ 数据内容不正确');
      }
    } else {
      console.log('❌ 未找到2026-03-31数据');
      console.log('   所有日期:', result.data.map(d => d.date).join(', '));
      console.log('\n❌❌❌ 失败！重新创建后不显示');
    }
  }
}

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

async function main() {
  try {
    console.log('=== 真实API测试：模拟前端操作 ===');

    // 清理旧数据
    await cleanup();

    // 创建数据
    const createResult = await createData();
    await queryData();

    // 删除数据
    if (createResult.success && createResult.data) {
      await deleteData(createResult.data.id);
      await queryData();
    } else {
      console.log('\n❌ 跳过测试：创建数据失败');
      return;
    }

    // 重新创建数据
    await recreateData();
    await verifyData();

  } catch (error) {
    console.error('错误:', error.message);
  }
}

main();
