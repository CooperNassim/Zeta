const fs = require('fs');
const { pool } = require('../src/config/database');

async function recreateDB() {
  const sql = fs.readFileSync('./migrations/migration_complete_v4.sql', 'utf-8');
  try {
    await pool.query(sql);
    console.log('数据库重建完成');
  } catch (err) {
    console.error('错误:', err.message);
  } finally {
    await pool.end();
  }
}

recreateDB();
