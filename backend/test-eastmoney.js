const https = require('https');

const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=1.600036&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=1&end=20500101&lmt=5`;

console.log('Testing URL:', url);

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Referer': 'https://quote.eastmoney.com/',
  'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
};

const req = https.get(url, {
  timeout: 15000,
  headers,
}, (res) => {
  console.log('Response status:', res.statusCode);
  console.log('Response headers:', JSON.stringify(res.headers));
  let body = '';
  res.on('data', chunk => { body += chunk; });
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log('Success! Klines count:', data.data?.klines?.length || 0);
      if (data.data?.klines) {
        console.log('First line:', data.data.klines[0]);
      }
    } catch (e) {
      console.error('JSON parse error:', e.message);
      console.error('Raw response:', body.slice(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.code, e.message);
});

req.on('timeout', () => {
  req.destroy();
  console.error('Timeout');
});
