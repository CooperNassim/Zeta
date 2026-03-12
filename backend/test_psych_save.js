// 测试前端心理测试保存功能
const http = require('http');

const testData = {
  test_date: '2026-03-12',
  scores: {
    '1': 2,
    '2': 1,
    '3': 2,
    '4': 2,
    '5': 1
  },
  overall_score: 8.0,
  notes: '测试保存'
};

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/psychological_test_results',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify(testData))
  }
};

console.log('正在测试保存心理测试数据到数据库...');
console.log('数据:', JSON.stringify(testData, null, 2));

const req = http.request(options, res => {
  let data = '';
  console.log('响应状态:', res.statusCode);
  console.log('响应头:', JSON.stringify(res.headers, null, 2));

  res.on('data', chunk => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('响应数据:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('解析后的响应:', JSON.stringify(parsed, null, 2));
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
