const http = require('http');

const req = http.get('http://localhost:3001/api/sync/all', (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    console.log('响应:', data.substring(0, 500) + '...');
  });
});

req.on('error', e => console.error('错误:', e.message));
