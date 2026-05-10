const { pool } = require('./src/config/database');

async function checkStockPoolIds() {
  try {
    const r = await pool.query(
      "SELECT id, symbol, name, market FROM stock_pool WHERE deleted = false ORDER BY id LIMIT 10"
    );
    console.log('Stock pool records:');
    r.rows.forEach(row => {
      console.log(`  id=${row.id} symbol=${row.symbol} market=${row.market} name="${row.name}"`);
    });
    console.log(`\nTotal count: ${r.rowCount}`);

    // Check if all IDs are unique
    const r2 = await pool.query(
      "SELECT COUNT(*) as total, COUNT(DISTINCT id) as unique_ids FROM stock_pool WHERE deleted = false"
    );
    console.log(`Total: ${r2.rows[0].total}, Unique IDs: ${r2.rows[0].unique_ids}`);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

checkStockPoolIds();
