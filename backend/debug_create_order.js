require('dotenv').config();
const http = require('http');

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testCreateOrder() {
  console.log('=== 测试创建订单 ===\n');

  try {
    // 查看数据库中现有的订单结构
    console.log('1. 查看现有订单数据结构...');
    const syncResult = await makeRequest('GET', '/api/sync/all');
    const existingOrders = syncResult.data?.trade_orders || [];
    
    if (existingOrders.length > 0) {
      console.log('现有订单示例:');
      console.log(JSON.stringify(existingOrders[0], null, 2));
    } else {
      console.log('没有现有订单数据');
    }
    console.log('');

    // 2. 创建测试订单（使用简化的字段）
    console.log('2. 创建测试订单...');
    const newOrder = {
      trade_number: 'TEST_' + Date.now(),
      order_type: 'buy',
      symbol: 'TEST',
      name: '测试',
      price: 100,
      quantity: 10
    };

    console.log('请求数据:', JSON.stringify(newOrder, null, 2));
    const createResult = await makeRequest('POST', '/api/trade_orders', newOrder);
    console.log('响应状态:', createResult.status);
    console.log('响应数据:', JSON.stringify(createResult.data, null, 2));

    if (createResult.status === 201) {
      console.log('\n✅ 创建成功！');
    } else {
      console.log('\n❌ 创建失败');
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

testCreateOrder();
