const { pool } = require('../src/config/database');

async function checkSchema() {
  try {
    const result = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns 
       WHERE table_name = 'daily_work_data' 
       ORDER BY ordinal_position`
    );
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();
