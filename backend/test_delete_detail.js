const http = require('http');

const testApi = async (path, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: 'localhost',
      port: 3001,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
};

(async () => {
  try {
    console.log('=== 测试删除流程 ===\n');

    // 1. 查询当前列表
    console.log('1. 查询当前记录...');
    const list = await testApi('/api/trading_strategies');
    console.log('   当前记录数:', list.data?.length || 0);
    list.data.slice(0, 3).forEach(r => {
      console.log(`   ID:${r.id}, 名称:${r.name}, 已删除:${r.deleted}`);
    });

    if (!list.data || list.data.length === 0) {
      console.log('   没有记录可测试');
      return;
    }

    // 2. 删除第一条记录
    const targetId = list.data[0].id;
    console.log(`\n2. 删除记录 ID=${targetId}...`);
    const delResult = await testApi(`/api/trading_strategies/${targetId}`, 'DELETE');
    console.log('   删除结果:', delResult.success ? '成功' : '失败');
    if (!delResult.success) {
      console.log('   错误:', delResult.error);
    }

    // 3. 再次查询列表
    console.log('\n3. 查询删除后的列表...');
    const afterDelete = await testApi('/api/trading_strategies');
    console.log('   记录数:', afterDelete.data?.length || 0);

    // 4. 检查被删除的记录是否还在列表中
    const stillExists = afterDelete.data?.find(r => r.id === targetId);
    if (stillExists) {
      console.log(`   ❌ 问题: ID=${targetId} 的记录仍在列表中!`);
      console.log(`      deleted字段值: ${stillExists.deleted}`);
    } else {
      console.log(`   ✅ ID=${targetId} 的记录已从列表中移除`);
    }

  } catch (error) {
    console.error('错误:', error.message);
  }
})();
