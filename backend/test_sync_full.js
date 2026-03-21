const http = require('http');

http.get('http://localhost:3000/api/sync/all', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('完整响应键:', Object.keys(result.data));

      // 检查是否有 orders
      if (result.data.orders) {
        console.log('\n找到 orders 键!');
        console.log('orders 数据:', JSON.stringify(result.data.orders));
      }

      // 检查是否有 trade_orders
      if (result.data.trade_orders) {
        console.log('\n找到 trade_orders 键!');
        console.log('trade_orders 数据:', JSON.stringify(result.data.trade_orders));
      }
    } catch (e) {
      console.error('解析错误:', e.message);
      // 尝试查找 orders 字符串
      const ordersMatch = data.match(/"orders":/g);
      if (ordersMatch) {
        console.log('在响应中找到 "orders" 出现次数:', ordersMatch.length);
        // 打印 "orders" 周围的内容
        const ordersIndex = data.indexOf('"orders"');
        console.log('orders 附近的文本:');
        console.log(data.substring(ordersIndex - 100, ordersIndex + 200));
      }
    }
  });
}).on('error', (err) => {
  console.error('请求错误:', err.message);
});
