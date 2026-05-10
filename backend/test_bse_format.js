const http = require('http');

function emRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, {
      headers: { 'Referer': 'https://quote.eastmoney.com/' },
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON: ' + e.message)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

(async () => {
  // Test different secid formats for BSE stock 920000
  const formats = [
    '0.920000',
    '1.920000',
    '920000',
    'BJ920000',
    '43.920000',
  ];

  for (const secid of formats) {
    try {
      const data = await emRequest(
        `http://push2his.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=f58,f57`
      );
      console.log(`secid=${secid}: f57=${data.data?.f57}, f58=${data.data?.f58}`);
    } catch (e) {
      console.log(`secid=${secid}: ${e.message}`);
    }
  }

  // Also try the realtime quote API
  try {
    const data = await emRequest(
      'http://push2.eastmoney.com/api/qt/stock/get?secid=0.920000&fields=f58,f57,f43,f44,f45,f46'
    );
    console.log(`Realtime secid=0.920000: ${JSON.stringify(data.data)}`);
  } catch (e) {
    console.log(`Realtime secid=0.920000: ${e.message}`);
  }

  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
