const http = require('http');
const data = JSON.stringify({
  buy_price: 21,
  trade_commission: null,
  other_fees: null,
  actual_sell_price: 14,
  sell_trade_commission: null,
  sell_other_fees: null,
  trade_summary: 'test'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/trade_records/12',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
