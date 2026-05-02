const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('开始检查数据库结构...');

    const existingTables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name NOT LIKE 'pg_%%' AND table_name NOT LIKE 'sql_%%'
    `);

    const existingTableNames = existingTables.rows.map(r => r.table_name);
    console.log('已存在的表:', existingTableNames.length > 0 ? existingTableNames.join(', ') : '无');

    const sql = fs.readFileSync(path.join(__dirname, '../../migrations/migration_complete_v4.sql'), 'utf8');

    const statements = sql.split(';').filter(s => s.trim());

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;

      try {
        if (trimmed.toUpperCase().includes('CREATE TABLE')) {
          const tableNameMatch = trimmed.match(/CREATE TABLE (\w+)/i);
          if (tableNameMatch) {
            const tableName = tableNameMatch[1];
            if (existingTableNames.includes(tableName)) {
              console.log(`跳过已存在的表: ${tableName}`);
              continue;
            }
          }
        }
        await client.query(trimmed);
      } catch (err) {
        if (err.message.includes('does not exist') || err.message.includes('already exists')) {
          continue;
        }
        console.error(`执行失败: ${trimmed.substring(0, 50)}... - ${err.message}`);
      }
    }

    console.log('✅ 数据库结构检查完成！');
  } catch (e) {
    console.error('❌ 检查失败:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
