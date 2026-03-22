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

async function showStructure() {
  console.log('=== 查看 trade_records 表结构 ===\n');

  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'trade_records'
      ORDER BY ordinal_position
    `);
    
    console.log('字段列表:');
    result.rows.forEach(col => {
      const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      console.log(`  ${col.column_name}: ${col.data_type}${maxLength} - nullable: ${col.is_nullable}`);
    });

    // 查询一些示例数据
    console.log('\n=== 前5条示例数据 ===');
    const sampleData = await client.query('SELECT * FROM trade_records ORDER BY id DESC LIMIT 5');
    sampleData.rows.forEach((row, index) => {
      console.log(`\n记录 ${index + 1}:`);
      Object.keys(row).forEach(key => {
        console.log(`  ${key}: ${row[key]}`);
      });
    });

  } catch (e) {
    console.error('查询失败:', e)
  } finally {
    client.release();
    await pool.end();
  }
}

showStructure().catch(console.error)
