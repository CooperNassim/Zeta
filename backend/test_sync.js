const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/sync/all',
  method: 'GET',
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('trade_orders 数量:', result.data.trade_orders?.length || 0);
      console.log('trade_orders 数据:', result.data.trade_orders);
    } catch (e) {
      console.log('响应:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('错误:', e.message);
});

req.end();
