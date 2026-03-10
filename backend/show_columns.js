const { pool } = require('./src/config/database');

async function showColumns() {
  const res = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name='daily_work_data' 
    ORDER BY ordinal_position
  `);
  console.log(res.rows.map(r => r.column_name).join(', '));
  process.exit(0);
}

showColumns();
