const http = require('http');

// 测试API是否可用
const testApi = async (url, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: url,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

(async () => {
  try {
    console.log('=== 检查后端API状态 ===\n');

    // 1. 检查健康状态
    console.log('1. 检查API服务状态...');
    try {
      const health = await testApi('/api/health');
      console.log(`   服务状态: ${health.status || '运行中'}`);
    } catch (e) {
      console.log('   ❌ API服务未运行!');
      process.exit(1);
    }

    // 2. 查询交易策略列表
    console.log('\n2. 查询交易策略列表...');
    const list = await testApi('/api/trading_strategies');
    console.log(`   返回状态: ${list.success ? '成功' : '失败'}`);
    console.log(`   返回记录数: ${list.data?.length || 0}`);
    if (list.data && list.data.length > 0) {
      console.log('   记录示例:');
      list.data.slice(0, 3).forEach(r => {
        console.log(`     ID:${r.id}, 名称:${r.name}, 已删除:${r.deleted}`);
      });
    }

    // 3. 测试新增
    console.log('\n3. 测试新增交易策略...');
    const newStrategy = {
      strategy_type: 'test_type',
      name: 'API测试_临时',
      status: '启用'
    };
    const createResult = await testApi('/api/trading_strategies', 'POST', newStrategy);
    console.log(`   新增结果: ${createResult.success ? '成功' : '失败'}`);
    if (createResult.success && createResult.data) {
      console.log(`   新增ID: ${createResult.data.id}`);

      // 4. 测试查询（确认新增成功）
      console.log('\n4. 查询新增后的列表...');
      const afterCreate = await testApi('/api/trading_strategies');
      console.log(`   返回记录数: ${afterCreate.data?.length || 0}`);

      // 5. 测试删除
      console.log('\n5. 测试删除交易策略...');
      const deleteResult = await testApi(`/api/trading_strategies/${createResult.data.id}`, 'DELETE');
      console.log(`   删除结果: ${deleteResult.success ? '成功' : '失败'}`);

      // 6. 测试查询（确认删除成功）
      console.log('\n6. 查询删除后的列表...');
      const afterDelete = await testApi('/api/trading_strategies');
      console.log(`   返回记录数: ${afterDelete.data?.length || 0}`);

      // 检查刚删除的是否还在列表中
      const deletedStillExists = afterDelete.data?.find(r => r.id === createResult.data.id);
      if (deletedStillExists) {
        console.log('   ❌ 问题: 已删除的记录仍在列表中!');
      } else {
        console.log('   ✅ 已删除的记录已从列表中移除');
      }
    }

    console.log('\n=== API测试完成 ===');
  } catch (error) {
    console.error('错误:', error.message);
    console.log('\n提示: 请确保后端服务正在运行 (npm run dev)');
  }
})();
