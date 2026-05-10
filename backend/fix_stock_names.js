const {pool} = require('./src/config/database');
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
  console.log('[修复北交所名称] 开始...');

  const needFix = await pool.query(
    "SELECT symbol FROM stock_pool WHERE deleted = false AND symbol LIKE '920%' AND (name IS NULL OR name = '' OR position(E'\\xef\\xbf\\xbd' in name) > 0) ORDER BY symbol"
  );

  console.log(`需要修复: ${needFix.rows.length} 只北交所股票`);

  if (needFix.rows.length === 0) {
    console.log('无需修复');
    process.exit(0);
  }

  let updated = 0;
  let failed = 0;

  // 批量请求（每次50只）
  for (let i = 0; i < needFix.rows.length; i += 50) {
    const batch = needFix.rows.slice(i, i + 50);
    const promises = batch.map(async ({symbol}) => {
      try {
        const data = await emRequest(
          `http://push2.eastmoney.com/api/qt/stock/get?secid=0.${symbol}&fields=f58`
        );
        const name = data.data?.f58;

        if (name && name.trim()) {
          await pool.query(
            "UPDATE stock_pool SET name = $1 WHERE symbol = $2 AND deleted = false",
            [name, symbol]
          );
          updated++;
        } else {
          failed++;
        }
      } catch (e) {
        failed++;
      }
    });

    await Promise.all(promises);
    console.log(`  批次 ${Math.floor(i / 50) + 1}: 累计成功 ${updated}, 失败 ${failed}`);

    // 批次间延迟
    if (i + 50 < needFix.rows.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`[修复完成] 更新 ${updated} 只，失败 ${failed} 只`);

  const validCount = await pool.query(
    "SELECT COUNT(*) as cnt FROM stock_pool WHERE deleted = false AND name IS NOT NULL AND name <> '' AND position(E'\\xef\\xbf\\xbd' in name) = 0"
  );
  console.log(`  最终有效名称: ${validCount.rows[0].cnt} 只 / ${needFix.rows[0]?.cnt || 6203} 只`);
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
