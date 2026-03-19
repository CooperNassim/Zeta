const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/daily_work_data/bulk/delete',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    console.log('响应:', data);
  });
});

req.on('error', (err) => {
  console.error('Error:', err.message);
});

req.write(JSON.stringify({ dates: ['2026-03-10'] }));
req.end();
