require('dotenv').config();
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

const backupDir = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');

// 确保备份目录存在
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// 导出所有数据
async function exportAllData() {
  console.log('📦 Starting data export...\n');

  try {
    const tables = [
      'account',
      'daily_work_data',
      'psychological_indicators',
      'psychological_tests',
      'trading_strategies',
      'risk_models',
      'risk_config',
      'account_risk_data',
      'technical_indicators',
      'orders',
      'transactions',
      'trade_records',
      'stock_pool',
      'stock_kline_data',
      'strategy_records'
    ];

    const exportData = {};

    for (const table of tables) {
      console.log(`  📊 Exporting ${table}...`);
      const result = await pool.query(`SELECT * FROM ${table}`);
      exportData[table] = result.rows;
      console.log(`     ✓ ${result.rows.length} records`);
    }

    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: exportData
    };

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `zeta-backup-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    // 写入文件
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf8');

    const stats = fs.statSync(filepath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log('\n✅ Backup completed successfully!');
    console.log(`📁 File: ${filename}`);
    console.log(`💾 Size: ${sizeMB} MB`);
    console.log(`📍 Location: ${filepath}`);

    return filepath;
  } catch (error) {
    console.error('\n❌ Backup failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// 运行备份
exportAllData()
  .then(filepath => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
