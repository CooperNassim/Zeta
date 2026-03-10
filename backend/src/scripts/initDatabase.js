require('dotenv').config({ path: './.env' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const sql = fs.readFileSync(path.join(__dirname, '../database/init.sql'), 'utf8');

async function main() {
  try {
    await pool.query(sql);
    console.log('✅ 数据库初始化成功！');
  } catch (e) {
    console.error('❌ 初始化失败:', e.message);
  } finally {
    pool.end();
  }
}

main();
