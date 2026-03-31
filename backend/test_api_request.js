const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/sync/all',
  method: 'GET',
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头: ${JSON.stringify(res.headers)}`);

  res.setEncoding('utf8');
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n响应体:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2).substring(0, 1000) + '...');
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error(`请求错误: ${error.message}`);
});

req.end();
