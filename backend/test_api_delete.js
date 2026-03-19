const http = require('http');

// 测试批量删除API
const testDeleteAPI = async () => {
  console.log('=== 测试后端删除API ===\n');

  const testData = {
    dates: ['2026-03-04']
  };

  const postData = JSON.stringify(testData);

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/daily_work_data/bulk',
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`状态码: ${res.statusCode}`);
        console.log(`响应: ${data}`);
        resolve(JSON.parse(data));
      });
    });

    req.on('error', (error) => {
      console.error('请求错误:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
};

// 测试查询API
const testGetAPI = async () => {
  console.log('\n=== 测试后端查询API ===\n');

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/daily_work_data',
    method: 'GET'
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`状态码: ${res.statusCode}`);
        const result = JSON.parse(data);
        console.log(`返回数据数量: ${result.data?.length || 0}`);
        if (result.data && result.data.length > 0) {
          console.log('数据:', result.data.map(d => ({ id: d.id, date: d.date, deleted: d.deleted })));
        }
        resolve(result);
      });
    });

    req.on('error', (error) => {
      console.error('请求错误:', error.message);
      reject(error);
    });

    req.end();
  });
};

// 测试同步API
const testSyncAPI = async () => {
  console.log('\n=== 测试后端同步API ===\n');

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/sync/all',
    method: 'GET'
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`状态码: ${res.statusCode}`);
        const result = JSON.parse(data);
        console.log(`每日功课数据数量: ${result.data?.daily_work_data?.length || 0}`);
        if (result.data && result.data.daily_work_data) {
          console.log('数据:', result.data.daily_work_data.map(d => ({ id: d.id, date: d.date, deleted: d.deleted })));
        }
        resolve(result);
      });
    });

    req.on('error', (error) => {
      console.error('请求错误:', error.message);
      reject(error);
    });

    req.end();
  });
};

(async () => {
  try {
    // 1. 先查询当前数据
    await testGetAPI();

    // 2. 测试同步API
    await testSyncAPI();

    // 3. 测试删除API
    await testDeleteAPI();

    // 4. 删除后再次查询
    await testGetAPI();

    // 5. 删除后再次同步
    await testSyncAPI();

  } catch (err) {
    console.error('测试失败:', err.message);
  }
})();
