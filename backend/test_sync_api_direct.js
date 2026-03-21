require('dotenv').config();
const http = require('http');

http.get('http://localhost:3000/api/sync/all', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log('=== sync/all 接口返回的 trade_orders ===');
    const orders = result.data?.trade_orders || [];
    console.log(`订单数量: ${orders.length}`);
    if (orders.length > 0) {
      console.log('\n订单列表:');
      orders.forEach(o => {
        console.log(`  - ID: ${o.id}, 编号: ${o.trade_number}, 删除: ${o.deleted}, 股票: ${o.symbol}`);
      });
    } else {
      console.log('\n没有订单数据（正确，因为所有订单都已删除）');
    }
  });
}).on('error', (err) => {
  console.error('请求失败:', err.message);
});
