const http = require('http');

// 发送HTTP请求的辅助函数
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
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
}

async function testFrontendOperation() {
  try {
    console.log('========== 模拟前端编辑操作 ==========');
    
    // 1. 清理
    console.log('\n1. 清理旧数据...');
    await request('POST', '/api/daily_work_data/bulk/delete', { ids: [] }); // 同步接口
    const { pool } = require('./src/config/database');
    await pool.query(`DELETE FROM daily_work_data WHERE date IN ('2026-03-16', '2026-03-29', '2026-03-30')`);
    console.log('   ✅ 清理完成');
    
    // 2. 通过API创建数据
    console.log('\n2. 通过前端API创建数据...');
    const r1 = await request('POST', '/api/daily_work_data', {
      date: '2026-03-16',
      nasdaq: '100',
      sentiment: '微热',
      prediction: '看涨',
      trade_status: '积极地'
    });
    console.log(`   ✅ 创建3月16日: id=${r1.data.id}, date=${r1.data.date}`);
    
    const r2 = await request('POST', '/api/daily_work_data', {
      date: '2026-03-29',
      nasdaq: '200',
      sentiment: '微冷',
      prediction: '看跌',
      trade_status: '保守地'
    });
    console.log(`   ✅ 创建3月29日: id=${r2.data.id}, date=${r2.data.date}`);
    
    // 3. 同步数据获取当前状态
    console.log('\n3. 同步数据...');
    const sync1 = await request('GET', '/api/sync/all');
    const workData1 = sync1.data.daily_work_data.filter(d => !d.deleted && ['2026-03-16', '2026-03-29'].includes(d.date));
    console.log('   当前数据:', workData1.map(d => ({id: d.id, date: d.date})));
    
    // 4. 尝试将3月29日改成3月16日（应该报错）
    console.log('\n4. 尝试将3月29日改成3月16日（应该报错）...');
    try {
      await request('PUT', `/api/daily_work_data/${r2.data.id}`, {
        date: '2026-03-16',
        nasdaq: '999'
      });
      console.log('   ❌ 应该报错但成功了！');
    } catch (e) {
      console.log(`   ✅ 正确报错`);
    }
    
    // 5. 删除3月16日
    console.log('\n5. 删除3月16日数据...');
    await request('DELETE', `/api/daily_work_data/${r1.data.id}`);
    console.log('   ✅ 删除完成');
    
    // 6. 再次将3月29日改成3月16日（应该成功）
    console.log('\n6. 将3月29日改成3月16日（应该成功）...');
    const r3 = await request('PUT', `/api/daily_work_data/${r2.data.id}`, {
      date: '2026-03-16',
      nasdaq: '999'
    });
    console.log(`   ✅ 更新成功: id=${r3.data.id}, date=${r3.data.date}, nasdaq=${r3.data.nasdaq}`);
    
    // 7. 同步数据查看结果
    console.log('\n7. 同步数据查看结果...');
    const sync2 = await request('GET', '/api/sync/all');
    const workData2 = sync2.data.daily_work_data.filter(d => !d.deleted && ['2026-03-16', '2026-03-29'].includes(d.date));
    console.log('   当前数据:', workData2.map(d => ({id: d.id, date: d.date, nasdaq: d.nasdaq})));
    
    // 8. 将3月16日改成3月30日（新日期）
    console.log('\n8. 将3月16日改成3月30日...');
    const r4 = await request('PUT', `/api/daily_work_data/${r3.data.id}`, {
      date: '2026-03-30',
      nasdaq: '888'
    });
    console.log(`   ✅ 更新成功: id=${r4.data.id}, date=${r4.data.date}, nasdaq=${r4.data.nasdaq}`);
    
    // 9. 最终同步验证
    console.log('\n9. 最终数据验证...');
    const sync3 = await request('GET', '/api/sync/all');
    const workData3 = sync3.data.daily_work_data.filter(d => !d.deleted && ['2026-03-16', '2026-03-29', '2026-03-30'].includes(d.date));
    console.log('   当前数据:', workData3.map(d => ({id: d.id, date: d.date, nasdaq: d.nasdaq})));
    
    // 10. 清理
    console.log('\n10. 清理测试数据...');
    const ids = [r1.data.id, r2.data.id];
    await request('POST', '/api/daily_work_data/bulk/delete', { ids });
    console.log('   ✅ 清理完成');
    
    console.log('\n========== 测试完成 ==========');
    process.exit(0);
  } catch (e) {
    console.error('\n错误:', e.message);
    process.exit(1);
  }
}

testFrontendOperation();
