require('dotenv').config({ path: './.env' });
const { Pool } = require('pg');

console.log('DB config:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ? '***' : 'undefined'
});

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function main() {
  try {
    const client = await pool.connect();
    console.log('Connected to database');

    const result = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log('数据库中的表:');
    result.rows.forEach(t => console.log('  - ' + t.table_name));

    client.release();
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}

main();
