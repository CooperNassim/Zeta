/**
 * 清理旧迁移脚本
 * 
 * 此脚本用于整理和归档旧的迁移文件:
 * 1. 将旧的迁移脚本移动到 archive 目录
 * 2. 保留重要的迁移文件作为参考
 * 3. 生成清理报告
 */

const fs = require('fs');
const path = require('path');

// 旧迁移脚本分类
const oldMigrations = {
  // 可以归档的迁移脚本
  archive: [
    'migration_2026-03-11T13-40-37.sql',
    'migration_2026-03-11T14-59-11.sql',
    'migration_2026-03-12T15-38-07.sql',
    'migration_complete_v3.sql',
    'migration_complete_v3_fixed.sql',
    'migration_incremental_2026-03-11T14-59-11.sql',
    'migration_incremental_2026-03-12T15-38-07.sql'
  ],
  
  // 可以删除的根目录脚本(功能已整合)
  deleteRoot: [
    'add_buy_order_id_field.js',
    'add_revision_column.js',
    'fix_buy_order_id.js',
    'fix_trade_records_schema.js',
    'migrate_deleted_fields.js',
    'migrate_trade_records_sync.js'
  ],
  
  // 可以归档的根目录脚本
  archiveRoot: [
    'check_buy_order_price.cjs',
    'check_duplicate_triggers.cjs',
    'check_orders_cols_temp.cjs',
    'check_orders_status.cjs',
    'check_price2.cjs',
    'check_table_structure.cjs',
    'check_trigger_status.cjs',
    'check_triggers.cjs',
    'cleanup_duplicate_triggers.cjs',
    'fix_trigger.cjs',
    'manual_sell_test.cjs',
    'sync_all_orders.cjs',
    'sync_existing_orders.js',
    'test_fixed_trigger.cjs',
    'test_trigger_detailed.cjs',
    'test_trigger_direct.cjs',
    'test_trigger_sync.js',
    'test_with_debug.cjs'
  ],
  
  // 保留的迁移脚本(可选执行)
  keep: [
    'migration_add_trade_fields.sql',
    'migration_fix_order_time.sql',
    'migration_trading_strategy_id_trigger.sql',
    'migration_complete_v4.sql',
    'MIGRATION_GUIDE.md'
  ],
  
  // 已经整合到 V4 的迁移
  integrated: [
    'migration_psychological_test_refactor.sql',
    'migration_psychological_test_timezone_fix.sql',
    'migration_risk_config_simple.sql',
    'migration_sync_soft_delete.sql',
    'migration_trade_records_complete.sql',
    'migration_trade_records_refactor.sql',
    'migration_trade_records_sync.sql',
    'migration_trading_strategy_refactor.sql',
    'migration_trading_strategy_revision_fix.sql',
    'migration_utc_time.sql'
  ]
};

// 创建归档目录
function createArchiveDir() {
  const backendDir = path.join(__dirname);
  const archiveDir = path.join(backendDir, 'archive');
  const migrationsArchiveDir = path.join(backendDir, 'migrations', 'archive');
  
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }
  
  if (!fs.existsSync(migrationsArchiveDir)) {
    fs.mkdirSync(migrationsArchiveDir, { recursive: true });
  }
  
  return { archiveDir, migrationsArchiveDir };
}

// 移动文件到归档目录
function moveToArchive(files, sourceDir, targetDir) {
  const movedFiles = [];
  const failedFiles = [];
  
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    if (!fs.existsSync(sourcePath)) {
      console.log(`  ⚠  File not found: ${file}`);
      failedFiles.push({ file, reason: 'not found' });
      return;
    }
    
    try {
      if (fs.existsSync(targetPath)) {
        // 目标文件已存在,添加时间戳
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const targetPathWithTimestamp = `${targetPath}.${timestamp}`;
        fs.renameSync(sourcePath, targetPathWithTimestamp);
        console.log(`  ✓  Archived: ${file} -> ${path.basename(targetPathWithTimestamp)}`);
      } else {
        fs.renameSync(sourcePath, targetPath);
        console.log(`  ✓  Archived: ${file}`);
      }
      movedFiles.push(file);
    } catch (error) {
      console.log(`  ✗  Failed to archive ${file}: ${error.message}`);
      failedFiles.push({ file, reason: error.message });
    }
  });
  
  return { movedFiles, failedFiles };
}

// 删除文件
function deleteFiles(files, dir) {
  const deletedFiles = [];
  const failedFiles = [];
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠  File not found: ${file}`);
      failedFiles.push({ file, reason: 'not found' });
      return;
    }
    
    try {
      fs.unlinkSync(filePath);
      console.log(`  ✓  Deleted: ${file}`);
      deletedFiles.push(file);
    } catch (error) {
      console.log(`  ✗  Failed to delete ${file}: ${error.message}`);
      failedFiles.push({ file, reason: error.message });
    }
  });
  
  return { deletedFiles, failedFiles };
}

// 生成清理报告
function generateReport(actions) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      archived: actions.archived.length,
      deleted: actions.deleted.length,
      kept: oldMigrations.keep.length + oldMigrations.integrated.length,
      failed: actions.failed.length
    },
    details: {
      archived: actions.archived,
      deleted: actions.deleted,
      failed: actions.failed
    }
  };
  
  const reportPath = path.join(__dirname, 'cleanup_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n========================================');
  console.log('Cleanup Report');
  console.log('========================================');
  console.log(`Archived: ${report.summary.archived} files`);
  console.log(`Deleted: ${report.summary.deleted} files`);
  console.log(`Kept: ${report.summary.kept} files`);
  console.log(`Failed: ${report.summary.failed} files`);
  console.log(`Report saved to: ${reportPath}`);
  console.log('========================================\n');
}

// 主函数
function main() {
  console.log('========================================');
  console.log('Old Scripts Cleanup Utility');
  console.log('========================================\n');
  
  const { archiveDir, migrationsArchiveDir } = createArchiveDir();
  const backendDir = path.join(__dirname);
  const migrationsDir = path.join(__dirname, 'migrations');
  
  const actions = {
    archived: [],
    deleted: [],
    failed: []
  };
  
  // 1. 归档旧的迁移脚本
  console.log('1. Archiving old migration scripts...');
  const { movedFiles, failedFiles } = moveToArchive(
    oldMigrations.archive,
    migrationsDir,
    migrationsArchiveDir
  );
  actions.archived.push(...movedFiles);
  actions.failed.push(...failedFiles);
  
  // 2. 归档已经整合的迁移脚本
  console.log('\n2. Archiving integrated migration scripts...');
  const result2 = moveToArchive(
    oldMigrations.integrated,
    migrationsDir,
    migrationsArchiveDir
  );
  actions.archived.push(...result2.movedFiles);
  actions.failed.push(...result2.failedFiles);
  
  // 3. 归档根目录中的临时脚本
  console.log('\n3. Archiving temporary scripts from root...');
  const result3 = moveToArchive(
    oldMigrations.archiveRoot,
    backendDir,
    archiveDir
  );
  actions.archived.push(...result3.movedFiles);
  actions.failed.push(...result3.failedFiles);
  
  // 4. 删除过时的根目录脚本
  if (process.argv.includes('--delete')) {
    console.log('\n4. Deleting obsolete scripts from root...');
    const result4 = deleteFiles(oldMigrations.deleteRoot, backendDir);
    actions.deleted.push(...result4.deletedFiles);
    actions.failed.push(...result4.failedFiles);
  } else {
    console.log('\n4. Skipping deletion (use --delete to enable)');
    console.log('   To delete obsolete scripts, run:');
    console.log('   node cleanup_old_scripts.js --delete');
  }
  
  // 5. 显示保留的文件
  console.log('\n5. Files kept (reference):');
  oldMigrations.keep.forEach(file => {
    const filePath = path.join(migrationsDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✓  ${file}`);
    } else {
      console.log(`  ⚠  ${file} (not found)`);
    }
  });
  
  oldMigrations.integrated.forEach(file => {
    const filePath = path.join(migrationsArchiveDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✓  migrations/archive/${file} (integrated)`);
    } else {
      console.log(`  ⚠  migrations/archive/${file} (not found)`);
    }
  });
  
  // 6. 生成报告
  generateReport(actions);
  
  console.log('Cleanup completed!');
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { oldMigrations, main };
