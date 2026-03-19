const http = require('http');

// 创建一个原始的HTTP请求来测试
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/daily_work_data/bulk',
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': JSON.stringify({ dates: ['2026-03-10'] }).length
  }
};

console.log('发送请求:', options.path);
console.log('请求体:', JSON.stringify({ dates: ['2026-03-10'] }));

const req = http.request(options, (res) => {
  let data = '';

  console.log('\n响应状态码:', res.statusCode);
  console.log('响应头:', JSON.stringify(res.headers));

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n响应体:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('解析后的数据:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('无法解析JSON');
    }
  });
});

req.on('error', (err) => {
  console.error('请求错误:', err);
});

req.write(JSON.stringify({ dates: ['2026-03-10'] }));
req.end();
