const http = require('http');

const data = JSON.stringify({
  test_date: '2026-03-12',
  scores: { '1': 2, '2': 1, '3': 2, '4': 2, '5': 1 },
  overall_score: 8.0,
  notes: 'test'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/psychological_test_results',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let d = '';
  res.on('data', (chunk) => d += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', d);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

req.write(data);
req.end();
