const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/daily_work_data/bulk/delete',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};

const req = http.request(options, (res) => {
  console.log('=== 请求详情 ===');
  console.log('方法:', options.method);
  console.log('路径:', options.path);
  console.log('完整URL:', `http://${options.hostname}:${options.port}${options.path}`);
  console.log('\n=== 响应详情 ===');
  console.log('状态码:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));

  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('\n=== 响应体 ===');
    console.log(data);
  });
});

req.on('error', (err) => {
  console.error('Error:', err.message);
});

req.write(JSON.stringify({ dates: ['2026-03-12'] }));
req.end();
