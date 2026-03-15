const { pool } = require('./src/config/database');

async function checkTables() {
  try {
    const result = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%psych%'"
    );
    console.log('心理测试相关表:', result.rows.map(row => row.table_name));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkTables();
