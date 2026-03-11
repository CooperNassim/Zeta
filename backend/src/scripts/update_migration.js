const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function updateMigration() {
  try {
    console.log('📦 开始更新迁移文件...\n');

    const migrationsDir = path.join(__dirname, '../../migrations');

    // 1. 备份旧的迁移文件
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.startsWith('migration_') && f.endsWith('.sql'))
      .sort();

    if (files.length > 0) {
      const latestFile = files[files.length - 1];
      const backupDir = path.join(migrationsDir, 'backup');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
      }

      const backupFile = path.join(backupDir, `${latestFile}.bak`);
      fs.copyFileSync(
        path.join(migrationsDir, latestFile),
        backupFile
      );
      console.log(`✅ 已备份旧迁移文件到: backup/${latestFile}.bak`);
    }

    // 2. 重新生成完整的迁移文件
    console.log('\n🔄 重新生成完整迁移文件...');
    try {
      execSync('node src/scripts/export_schema.js', {
        cwd: path.join(__dirname, '../..'),
        stdio: 'inherit'
      });
      console.log('✅ 完整迁移文件已生成');
    } catch (error) {
      console.error('❌ 生成迁移文件失败:', error.message);
      process.exit(1);
    }

    // 3. 生成增量迁移文件（可选）
    console.log('\n🔄 生成增量迁移文件...');
    try {
      execSync('node src/scripts/export_schema_incremental.js', {
        cwd: path.join(__dirname, '../..'),
        stdio: 'inherit'
      });
      console.log('✅ 增量迁移文件已生成');
    } catch (error) {
      console.warn('⚠️  生成增量迁移文件失败（可能需要手动检查）');
    }

    // 4. 显示文件列表
    console.log('\n📋 当前迁移文件列表：');
    const newFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()
      .reverse();

    newFiles.forEach((file, index) => {
      const filePath = path.join(migrationsDir, file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024).toFixed(2);
      console.log(`  ${index + 1}. ${file} (${size} KB)`);
    });

    console.log('\n✨ 迁移文件更新完成！');
    console.log('\n📌 下一步操作：');
    console.log('   1. 将最新的完整迁移文件复制到公司电脑');
    console.log('   2. 在公司电脑运行: node src/scripts/import_schema.js');
    console.log('   3. 如果只需要更新表结构，使用增量迁移文件');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 更新失败:', error);
    process.exit(1);
  }
}

updateMigration();
