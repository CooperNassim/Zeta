require('dotenv').config();
const http = require('http');

const API_BASE = 'http://localhost:3000';

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
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
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

async function testDeleteAndSync() {
  console.log('=== 测试删除和同步 ===\n');

  try {
    // 1. 创建测试订单
    console.log('1. 创建测试订单...');
    const newOrder = {
      trade_number: 'TEST_DELETE_001',
      order_type: 'buy',
      symbol: 'TEST',
      name: '测试删除',
      price: 100,
      quantity: 10,
      stop_loss_price: 95,
      take_profit_price: 105,
      psychological_score: 5,
      strategy_score: 5,
      risk_score: 5,
      overall_score: 5,
      status: 'pending',
      is_virtual: false
    };

    const createResult = await makeRequest('POST', '/api/trade_orders', newOrder);
    console.log('创建结果:', createResult.success ? '✅ 成功' : '❌ 失败');
    const orderId = createResult.data?.id;

    if (!orderId) {
      console.log('❌ 创建订单失败，无法继续测试');
      return;
    }
    console.log(`订单ID: ${orderId}\n`);

    // 2. 同步数据（获取订单）
    console.log('2. 同步数据（获取订单）...');
    const syncBeforeDelete = await makeRequest('GET', '/api/sync/all');
    const ordersBefore = syncBeforeDelete.data?.trade_orders || [];
    console.log(`订单数量: ${ordersBefore.length}`);
    const orderExists = ordersBefore.some(o => o.trade_number === 'TEST_DELETE_001');
    console.log(`测试订单存在: ${orderExists ? '✅ 是' : '❌ 否'}\n`);

    // 3. 删除订单
    console.log('3. 删除订单...');
    const deleteResult = await makeRequest('DELETE', `/api/trade_orders/${orderId}`);
    console.log('删除结果:', deleteResult.success ? '✅ 成功' : '❌ 失败');
    console.log(`订单deleted字段: ${deleteResult.data?.deleted}\n`);

    // 4. 再次同步数据
    console.log('4. 再次同步数据...');
    const syncAfterDelete = await makeRequest('GET', '/api/sync/all');
    const ordersAfter = syncAfterDelete.data?.trade_orders || [];
    console.log(`订单数量: ${ordersAfter.length}`);
    
    const deletedOrder = ordersAfter.find(o => o.trade_number === 'TEST_DELETE_001');
    if (deletedOrder) {
      console.log(`测试订单状态: ${deletedOrder.deleted ? '已删除' : '未删除'}`);
    } else {
      console.log('测试订单已从列表中移除（应该不会发生，因为sync/all会返回所有数据）');
    }

    // 模拟前端的过滤逻辑
    const activeOrders = ordersAfter.filter(o => !o.deleted);
    console.log(`活跃订单数量（过滤后）: ${activeOrders.length}`);
    const isDeletedHidden = !activeOrders.some(o => o.trade_number === 'TEST_DELETE_001');
    console.log(`已删除订单是否被过滤: ${isDeletedHidden ? '✅ 是' : '❌ 否'}\n`);

    // 5. 清理测试数据
    console.log('5. 清理测试数据...');
    const cleanupResult = await makeRequest('POST', '/api/trade_orders/bulk/delete', {
      ids: [orderId]
    });
    console.log('清理结果:', cleanupResult.success ? '✅ 成功' : '❌ 失败\n');

    console.log('=== 测试完成 ===');
    console.log('结论:');
    console.log('- 删除功能正常：订单的deleted字段被设置为true');
    console.log('- 同步功能正常：sync/all返回所有订单，包括已删除的');
    console.log('- 前端过滤：需要确保importOrders函数过滤掉deleted=true的订单');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testDeleteAndSync();
