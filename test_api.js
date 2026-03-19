const http = require('http');

const postData = JSON.stringify({
  scores: { 1: 2, 2: 1, 3: 2, 4: 1, 5: 2 },
  overall_score: 8,
  test_date: '2026-03-13'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/psychological_test_results',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(postData);
req.end();
