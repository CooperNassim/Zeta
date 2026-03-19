import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { pool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
  try {
    // 读取迁移脚本
    const migrationPath = `${__dirname}/../../migrations/migration_psychological_test_refactor.sql`;
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('开始执行心理测试模块数据库重构...');
    console.log('----------------------------------------');

    // 执行迁移
    await pool.query(migrationSQL);

    console.log('----------------------------------------');
    console.log('✓ 心理测试模块数据库重构完成！');

    // 验证新表
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'psychological_%'
      ORDER BY table_name;
    `);

    console.log('\n创建的表:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    await pool.end();
  } catch (error) {
    console.error('迁移失败:', error);
    await pool.end();
    process.exit(1);
  }
})();
