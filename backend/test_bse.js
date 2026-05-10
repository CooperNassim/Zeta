const http = require('http');

function eastmoneyRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, {
      headers: {
        'Referer': 'https://quote.eastmoney.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('JSON parse error: ' + e.message));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

(async () => {
  // Test BSE market
  console.log('Testing BSE market...');

  try {
    const data = await eastmoneyRequest(
      'http://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=10&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=m:0+t:81&fields=f12,f14'
    );
    console.log('m:0+t:81 (北交所):', JSON.stringify(data.data?.diff?.slice(0, 3)));
  } catch (e) {
    console.log('m:0+t:81 失败:', e.message);
  }

  try {
    const data = await eastmoneyRequest(
      'http://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=10&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=m:1+t:81&fields=f12,f14'
    );
    console.log('m:1+t:81:', JSON.stringify(data.data?.diff?.slice(0, 3)));
  } catch (e) {
    console.log('m:1+t:81 失败:', e.message);
  }

  // Try getting a single BSE stock detail
  try {
    const data = await eastmoneyRequest(
      'http://push2his.eastmoney.com/api/qt/stock/get?secid=0.920000&fields=f58'
    );
    console.log('920000 详情:', JSON.stringify(data.data));
  } catch (e) {
    console.log('920000 详情失败:', e.message);
  }

  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
