const {pool} = require('./src/config/database');

const checkTable = async (table) => {
  try {
    const res = await pool.query(`SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = '${table}' ORDER BY ordinal_position`);
    console.log(`\n=== ${table} ===`);
    res.rows.forEach(r => console.log(`${r.column_name} | ${r.is_nullable} | ${r.data_type}`));
  } catch (e) {
    console.log(`ERROR for ${table}:`, e.message);
  }
};

(async () => {
  await checkTable('transactions');
  await checkTable('trade_records');
  pool.end();
})();
