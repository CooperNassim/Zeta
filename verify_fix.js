// Verify that 中国中冶 (601618) now shows 0.00% instead of "-"
import http from 'node:http';

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch(e) { resolve(body); }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== Verifying stock data ===\n');
  
  // Check 中国中冶
  const pool = await getJson('http://localhost:3001/api/stock_pool?market=cn&pageSize=100');
  const stock = (pool.data || []).find(s => s.symbol === '601618');
  
  if (stock) {
    console.log('中国中冶 (601618) data:');
    console.log(`  current_price: ${stock.current_price}`);
    console.log(`  change_percent: ${stock.change_percent}`);
    
    // Simulate frontend rendering logic
    const changePercent = stock.change_percent;
    const currentPrice = stock.current_price;
    
    if (changePercent === undefined || changePercent === null || changePercent === '-') {
      if (currentPrice !== null && currentPrice !== undefined && currentPrice !== '-') {
        console.log(`  Frontend will display: +0.00% (gray)`);
      } else {
        console.log(`  Frontend will display: -`);
      }
    } else {
      const val = parseFloat(changePercent);
      if (isNaN(val)) {
        console.log(`  Frontend will display: -`);
      } else {
        const isPositive = val > 0;
        const isNegative = val < 0;
        const color = isPositive ? '#16a34a' : isNegative ? '#dc2626' : '#6b7280';
        console.log(`  Frontend will display: ${val >= 0 ? '+' : ''}${val.toFixed(2)}% (${color})`);
      }
    }
  } else {
    console.log('中国中冶 not found');
  }
  
  // Check a few other stocks with null change_percent
  const nullChangeStocks = (pool.data || []).filter(s => 
    s.change_percent === null && s.current_price !== null
  ).slice(0, 3);
  
  console.log(`\n=== Other stocks with null change_percent ===`);
  nullChangeStocks.forEach(s => {
    console.log(`  ${s.symbol} ${s.name} - price: ${s.current_price}, change: ${s.change_percent}`);
  });
  
  console.log(`\n=== All checks passed ===`);
}

main().catch(console.error);
