const http = require('http');

const data = JSON.stringify({
  total_risk_percent: 6,
  single_risk_percent: 2
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
    console.log('恢复默认值完成');
    console.log('响应:', body);
  });
});

req.on('error', (e) => console.error('错误:', e));
req.write(data);
req.end();
