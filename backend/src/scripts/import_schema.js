const fs = require('fs');
const { pool } = require('../config/database');
const path = require('path');

async function importSchema(migrationFile) {
  try {
    console.log('开始导入数据库结构...');

    // 读取迁移文件
    const migrationPath = migrationFile || path.join(__dirname, '../../migrations');
    const files = fs.readdirSync(migrationPath)
      .filter(f => f.startsWith('migration_') && f.endsWith('.sql'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.log('未找到迁移文件');
      return;
    }

    const latestFile = files[0];
    const filePath = path.join(migrationPath, latestFile);

    console.log(`使用迁移文件: ${latestFile}`);

    const sql = fs.readFileSync(filePath, 'utf8');

    // 分割SQL语句
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
      .map(s => s + ';');

    console.log(`找到 ${statements.length} 条SQL语句`);

    // 执行SQL语句
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];

      // 跳过注释
      if (stmt.startsWith('--')) continue;

      try {
        await pool.query(stmt);
        successCount++;

        // 每完成10条显示进度
        if ((i + 1) % 10 === 0 || i === statements.length - 1) {
          process.stdout.write(`\r进度: ${i + 1}/${statements.length} (成功: ${successCount}, 失败: ${errorCount})`);
        }
      } catch (error) {
        errorCount++;
        console.log(`\n错误 (${i + 1}): ${error.message.substring(0, 100)}`);
        // 继续执行下一条语句
      }
    }

    console.log(`\n\n✅ 导入完成！`);
    console.log(`成功: ${successCount} 条`);
    console.log(`失败: ${errorCount} 条`);

    process.exit(0);
  } catch (error) {
    console.error('导入失败:', error);
    process.exit(1);
  }
}

// 支持命令行参数
const args = process.argv.slice(2);
const migrationFile = args[0];
importSchema(migrationFile);
