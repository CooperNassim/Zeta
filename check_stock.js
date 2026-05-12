// Check the actual data for 中国中冶 (601618)
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
  const pool = await getJson('http://localhost:3001/api/stock_pool?market=cn&pageSize=500');
  const stock = (pool.data || []).find(s => s.symbol === '601618');
  
  if (stock) {
    console.log('中国中冶 (601618) actual data:');
    console.log(JSON.stringify(stock, null, 2));
    console.log(`\nchange_percent value: ${stock.change_percent}`);
    console.log(`change_percent type: ${typeof stock.change_percent}`);
    console.log(`change_percent === null: ${stock.change_percent === null}`);
    console.log(`change_percent === 0: ${stock.change_percent === 0}`);
    console.log(`!stock.change_percent: ${!stock.change_percent}`);
  } else {
    console.log('中国中冶 not found');
  }
}

main().catch(console.error);
