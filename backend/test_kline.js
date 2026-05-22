const https = require('https');

async function testKlineData() {
  const symbol = '600426';
  const limit = 200;
  
  // 格式化 secid
  let secid = symbol;
  if (!symbol.includes('.')) {
    const prefix = symbol.startsWith('6') || symbol.startsWith('9') || symbol.startsWith('1') ? '1' : '0';
    secid = `${prefix}.${symbol}`;
  }
  
  const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=1&end=20500101&lmt=${limit}`;
  
  console.log(`请求 URL: ${url}`);
  
  const data = await new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
  
  if (data.data && data.data.klines) {
    const klines = data.data.klines;
    console.log(`\n总数据条数: ${klines.length}`);
    console.log('\n前5条数据:');
    klines.slice(0, 5).forEach((line, i) => {
      const parts = line.split(',');
      console.log(`${i + 1}. 日期: ${parts[0]}, 开盘: ${parts[1]}, 收盘: ${parts[2]}, 最高: ${parts[3]}, 最低: ${parts[4]}`);
    });
    console.log('\n最后5条数据:');
    klines.slice(-5).forEach((line, i) => {
      const parts = line.split(',');
      console.log(`${klines.length - 4 + i}. 日期: ${parts[0]}, 开盘: ${parts[1]}, 收盘: ${parts[2]}, 最高: ${parts[3]}, 最低: ${parts[4]}`);
    });
    
    // 检查是否有重复日期
    const dates = klines.map(line => line.split(',')[0]);
    const uniqueDates = new Set(dates);
    console.log(`\n总日期数: ${dates.length}`);
    console.log(`唯一日期数: ${uniqueDates.size}`);
    if (dates.length !== uniqueDates.size) {
      console.log('❌ 发现重复日期！');
    } else {
      console.log('✅ 没有重复日期');
    }
  } else {
    console.log('无数据');
    console.log('Response:', JSON.stringify(data).slice(0, 500));
  }
}

testKlineData();
