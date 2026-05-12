import { pool } from './backend/src/config/database.js';

async function main() {
  console.log('=== Stocks with change_percent = null but valid price ===\n');
  
  const result = await pool.query(`
    SELECT symbol, name, current_price, change_percent, volume
    FROM stock_pool 
    WHERE change_percent IS NULL AND current_price IS NOT NULL AND deleted = false
    ORDER BY symbol
    LIMIT 20
  `);
  
  console.log(`Found ${result.rowCount} stocks (showing first 20):\n`);
  result.rows.forEach(r => {
    console.log(`  ${r.symbol} ${r.name} - price: ${r.current_price}, change: ${r.change_percent}, vol: ${r.volume}`);
  });
  
  const countResult = await pool.query(`
    SELECT COUNT(*) 
    FROM stock_pool 
    WHERE change_percent IS NULL AND current_price IS NOT NULL AND deleted = false
  `);
  console.log(`\nTotal: ${countResult.rows[0].count}`);
  
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
