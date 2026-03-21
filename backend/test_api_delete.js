const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/trade_orders/bulk/delete',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    console.log('响应:', data);
  });
});

req.on('error', (e) => {
  console.error('错误:', e.message);
});

// 模拟前端发送的请求
const requestBody = JSON.stringify({
  ids: [3]  // 测试删除ID为3的记录
});

req.write(requestBody);
req.end();
