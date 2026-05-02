require('dotenv').config({ path: './.env' });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function main() {
  const force = process.argv.includes('--force');

  try {
    const client = await pool.connect();

    if (force) {
      await client.query('DROP DATABASE IF EXISTS zeta_trading');
      console.log('🗑️  数据库 zeta_trading 已删除');
    }

    await client.query('CREATE DATABASE zeta_trading');
    console.log('✅ 数据库 zeta_trading 创建成功！');

    client.release();
  } catch (e) {
    if (e.code === '42P04') {
      console.log('ℹ️ 数据库 zeta_trading 已存在');
    } else {
      console.error('❌ Error:', e.message);
    }
  } finally {
    pool.end();
  }
}

main();