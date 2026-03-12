// 测试前端心理测试更新功能
const http = require('http');

const testData = {
  test_date: '2026-03-12',
  scores: {
    '1': 3,
    '2': 2,
    '3': 3,
    '4': 2,
    '5': 2
  },
  overall_score: 8.5,
  notes: '测试更新'
};

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/psychological_test_results/by-date/2026-03-12',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify(testData))
  }
};

console.log('正在测试更新心理测试数据...');
console.log('数据:', JSON.stringify(testData, null, 2));

const req = http.request(options, res => {
  let data = '';
  console.log('响应状态:', res.statusCode);

  res.on('data', chunk => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('响应数据:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('解析后的响应:', JSON.stringify(parsed, null, 2));
      if (parsed.success) {
        console.log('✅ 更新成功！');
      } else {
        console.log('❌ 更新失败:', parsed.error);
      }
      process.exit(0);
    } catch (e) {
      console.error('解析响应失败:', e.message);
      process.exit(1);
    }
  });
});

req.on('error', error => {
  console.error('请求失败:', error.message);
  process.exit(1);
});

req.write(JSON.stringify(testData));
req.end();
