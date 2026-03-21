const http = require('http');

const req = http.get('http://localhost:3000/api/trade_orders', (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log('后端响应状态:', res.statusCode);
    console.log('响应数据:', data);
  });
});

req.on('error', e => console.error('错误:', e.message));
