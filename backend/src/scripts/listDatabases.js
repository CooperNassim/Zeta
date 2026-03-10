require('dotenv').config({ path: './.env' });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: 'postgres',  // 连接到默认数据库
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function main() {
  try {
    const client = await pool.connect();
    console.log('Connected to postgres');

    // 列出所有数据库
    const result = await client.query(
      "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname"
    );
    console.log('数据库列表:');
    result.rows.forEach(t => console.log('  - ' + t.datname));

    client.release();
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}

main();
