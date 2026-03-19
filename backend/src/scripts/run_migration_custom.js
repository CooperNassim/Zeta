import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { pool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 获取命令行参数
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('用法: node run_migration_custom.js <迁移脚本路径>');
  process.exit(1);
}

const migrationPath = args[0];

(async () => {
  try {
    // 读取迁移脚本
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log(`开始执行迁移脚本: ${migrationPath}`);
    console.log('----------------------------------------');

    // 执行迁移
    await pool.query(migrationSQL);

    console.log('----------------------------------------');
    console.log('✓ 迁移完成！');

    await pool.end();
  } catch (error) {
    console.error('迁移失败:', error);
    await pool.end();
    process.exit(1);
  }
})();
