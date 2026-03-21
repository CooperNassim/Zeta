require('dotenv').config();
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

// 导入数据
async function importData(filepath) {
  console.log('📥 Starting data import...\n');

  try {
    // 读取备份文件
    if (!fs.existsSync(filepath)) {
      throw new Error(`Backup file not found: ${filepath}`);
    }

    console.log(`📂 Reading backup file: ${filepath}`);
    const backupData = JSON.parse(fs.readFileSync(filepath, 'utf8'));

    console.log(`📋 Backup version: ${backupData.version}`);
    console.log(`🕒 Backup timestamp: ${backupData.timestamp}\n`);

    const { data } = backupData;

    // 导入顺序很重要（有外键约束的表后导入）
    const importOrder = [
      'account',
      'psychological_indicators',
      'trading_strategies',
      'risk_models',
      'risk_config',
      'technical_indicators',
      'daily_work_data',
      'psychological_tests',
      'account_risk_data',
      'trade_orders',
      'transactions',
      'stock_pool',
      'stock_kline_data',
      'trade_records',
      'strategy_records'
    ];

    const client = await pool.connect();
    let totalRecords = 0;

    try {
      await client.query('BEGIN');

      for (const table of importOrder) {
        const records = data[table];

        if (!records || records.length === 0) {
          console.log(`  ⏭️  Skipping ${table} (no data)`);
          continue;
        }

        console.log(`  📊 Importing ${table}...`);

        // 删除现有数据（可选，如果不想清空可以注释掉）
        // await client.query(`DELETE FROM ${table}`);
        // console.log(`     ✗ Cleared existing data`);

        // 插入新数据
        const columns = Object.keys(records[0]);
        const placeholders = records.map((_, i) =>
          `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`
        ).join(', ');

        const values = records.flatMap(record => Object.values(record));

        // 使用 ON CONFLICT DO NOTHING 避免重复
        const query = `
          INSERT INTO ${table} (${columns.join(', ')})
          VALUES ${placeholders}
          ON CONFLICT DO NOTHING
        `;

        const result = await client.query(query, values);
        console.log(`     ✓ ${result.rowCount} records imported`);
        totalRecords += result.rowCount;
      }

      await client.query('COMMIT');

      console.log('\n✅ Import completed successfully!');
      console.log(`📊 Total records imported: ${totalRecords}`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// 命令行参数
const args = process.argv.slice(2);
let filepath = null;

// 解析参数
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' || args[i] === '-f') {
    filepath = args[i + 1];
    i++;
  }
}

// 如果没有指定文件，使用最新的备份
if (!filepath) {
  const backupDir = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('zeta-backup-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error('❌ No backup files found!');
    console.log('Usage: npm run restore -- --file <backup-file>');
    process.exit(1);
  }

  filepath = path.join(backupDir, files[0]);
  console.log(`ℹ️  No file specified, using latest backup: ${files[0]}\n`);
}

// 运行导入
importData(filepath)
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
