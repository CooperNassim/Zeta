const http = require('http');

console.log('正在测试 /api/sync/all 端点...');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/sync/all',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  console.log(`状态码: ${res.statusCode}`);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('同步 API 响应成功');
      console.log('psychological_test_results 数据数量:', result.data?.psychological_test_results?.length || 0);
      if (result.data?.psychological_test_results?.length > 0) {
        console.log('最新的心理测试结果:', result.data.psychological_test_results[0]);
      }
    } catch (error) {
      console.error('解析响应失败:', error);
      console.log('原始响应:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('请求失败:', error.message);
});

req.setTimeout(5000, () => {
  console.error('请求超时');
  req.destroy();
});

req.end();
