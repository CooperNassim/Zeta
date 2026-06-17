require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

async function main() {
  try {
    // 检查所有表
    const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('数据库中的表:');
    tablesResult.rows.forEach(r => console.log(`  - ${r.table_name}`));
    
    // 检查关键表的数据量
    const keyTables = ['orders', 'trade_orders', 'trade_records', 'transactions', 'account'];
    for (const table of keyTables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        const deletedResult = await pool.query(`SELECT COUNT(*) as count FROM ${table} WHERE deleted = false`);
        console.log(`\n${table}:`);
        console.log(`  总数: ${result.rows[0].count}`);
        console.log(`  未删除: ${deletedResult.rows[0].count}`);
      } catch (e) {
        console.log(`\n${table}: 表不存在或查询失败 - ${e.message}`);
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}

main();
