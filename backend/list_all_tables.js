const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 从.env文件读取数据库配置
const envFile = path.join(__dirname, '.env');
const envConfig = {};
if (fs.existsSync(envFile)) {
  const envLines = fs.readFileSync(envFile, 'utf-8').split('\n');
  envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      envConfig[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const pool = new Pool({
  host: envConfig.DB_HOST || 'localhost',
  port: envConfig.DB_PORT || 5432,
  database: envConfig.DB_NAME || 'zeta_trading',
  user: envConfig.DB_USER || 'postgres',
  password: envConfig.DB_PASSWORD || 'postgres',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function listAllTables() {
  console.log('=== 数据库中的所有表 ===\n');

  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('表列表:');
    result.rows.forEach(row => {
      console.log(`  ${row.table_name}`);
    });

    // 查询可能包含交易编号20260322005的表
    console.log('\n=== 搜索交易编号 20260322005 ===');
    
    const tables = result.rows.map(r => r.table_name);
    for (const table of tables) {
      try {
        const columns = await client.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table]);
        
        // 查找可能包含字符串类型的字段
        const stringColumns = columns.rows.filter(col => 
          col.data_type === 'character varying' || col.data_type === 'text'
        );
        
        if (stringColumns.length > 0) {
          console.log(`\n表 ${table} 的字符串字段:`);
          stringColumns.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type}`);
          });
        }
      } catch (e) {
        console.log(`查询表 ${table} 失败: ${e.message}`);
      }
    }

  } catch (e) {
    console.error('查询失败:', e)
  } finally {
    client.release();
    await pool.end();
  }
}

listAllTables().catch(console.error)
