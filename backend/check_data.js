const http = require('http');

const req = http.get('http://localhost:3001/api/daily_work_data', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log(JSON.stringify(json, null, 2));
  });
});
req.on('error', err => console.error(err));
