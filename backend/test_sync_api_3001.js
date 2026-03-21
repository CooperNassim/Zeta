const http = require('http');

http.get('http://localhost:3001/api/sync/all', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('API 响应中的键:', Object.keys(result.data));
      console.log('trade_orders 数量:', result.data.trade_orders?.length || 0);
      if (result.data.orders) {
        console.log('orders 数量:', result.data.orders.length);
      }
    } catch (e) {
      console.error('解析错误:', e.message);
      console.log('原始数据前500字符:', data.substring(0, 500));
    }
  });
}).on('error', (err) => {
  console.error('请求错误:', err.message);
});
