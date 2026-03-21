const http = require('http');

const data = JSON.stringify({
  total_risk_percent: 8,
  single_risk_percent: 3
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/risk_config/1',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    console.log('响应:', body);
  });
});

req.on('error', (e) => console.error('错误:', e));
req.write(data);
req.end();
