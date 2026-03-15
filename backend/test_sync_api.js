const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/sync/all',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('同步 API 响应成功');
      console.log('psychological_indicators 数据:', result.data?.psychological_indicators);
    } catch (error) {
      console.error('解析响应失败:', error);
      console.log('原始响应:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('请求失败:', error);
});

req.end();
