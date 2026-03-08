const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'zeta_trading',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('连接数据库...');
    await client.connect();

    console.log('读取迁移脚本...');
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, 'migrate_soft_delete.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('执行迁移脚本...');
    await client.query(migrationSQL);

    console.log('迁移完成！');
    console.log('\n所有表已成功添加软删除字段（deleted 和 deleted_at）。');
    console.log('现在所有删除操作都是软删除，数据会被标记为已删除而不是真正删除。');
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
