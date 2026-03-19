const http = require('http');

const req = http.get('http://localhost:3001/api/test', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});

req.on('error', err => console.error('Error:', err.message));
