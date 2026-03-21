const http = require('http');

// 测试查询 trade_orders
http.get('http://localhost:3000/api/trade_orders', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log('GET /api/trade_orders 结果:');
    console.log('success:', result.success);
    console.log('data count:', result.data?.length || 0);
  });
});

// 测试查询 orders (应该失败)
setTimeout(() => {
  http.get('http://localhost:3000/api/orders', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      const result = JSON.parse(data);
      console.log('\nGET /api/orders 结果:');
      console.log('success:', result.success);
      if (!result.success) {
        console.log('error:', result.error);
      } else {
        console.log('data count:', result.data?.length || 0);
      }
    });
  });
}, 500);
