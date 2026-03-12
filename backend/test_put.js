const http = require('http');

const testData = {
  scores: {'1': 3, '2': 2, '3': 3, '4': 2, '5': 2},
  overall_score: 8.5,
  notes: '测试更新'
};

console.log('Testing PUT request...');
console.log('Path: /api/psychological_test_results/by-date/2026-03-12');

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

const req = http.request(options, res => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));

  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log('Response:', data);
    process.exit(0);
  });
});

req.on('error', err => {
  console.error('Error:', err.message);
  process.exit(1);
});

req.write(JSON.stringify(testData));
req.end();
