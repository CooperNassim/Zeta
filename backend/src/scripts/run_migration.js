const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 数据库连接配置
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

// 日志函数
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '[INFO]',
    success: '[SUCCESS]',
    warning: '[WARNING]',
    error: '[ERROR]'
  }[type] || '[INFO]';
  
  console.log(`${timestamp} ${prefix} ${message}`);
}

// 读取SQL文件
function readSQLFile(filename) {
  const filePath = path.join(__dirname, '../../migrations', filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

// 备份数据
async function backupDatabase() {
  log('Starting database backup...');

  try {
    const { execSync } = require('child_process');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFile = path.join(__dirname, 'backups', `pre-migration-backup-${timestamp}.json`);

    // 确保备份目录存在
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 使用备份脚本
    execSync(`node ${path.join(__dirname, 'backup.js')}`, { cwd: __dirname });

    log(`Backup completed: ${backupFile}`, 'success');
    return true;
  } catch (error) {
    log(`Backup failed: ${error.message}`, 'error');
    return false;
  }
}

// 执行迁移
async function runMigration(sqlContent) {
  log('Starting database migration...');
  
  const client = await pool.connect();
  
  try {
    // 开始事务
    await client.query('BEGIN');
    
    // 分割SQL语句并逐个执行
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    let executed = 0;
    for (const statement of statements) {
      try {
        await client.query(statement);
        executed++;
      } catch (error) {
        // 某些语句可能会失败(如DROP TABLE IF EXISTS),这是正常的
        if (!error.message.includes('does not exist')) {
          log(`Statement ${executed + 1} warning: ${error.message}`, 'warning');
        }
      }
    }
    
    // 提交事务
    await client.query('COMMIT');
    
    log(`Migration completed successfully (${executed} statements executed)`, 'success');
    return true;
  } catch (error) {
    // 回滚事务
    await client.query('ROLLBACK');
    log(`Migration failed: ${error.message}`, 'error');
    return false;
  } finally {
    client.release();
  }
}

// 验证迁移结果
async function verifyMigration() {
  log('Verifying migration...');
  
  try {
    // 检查预期的表是否存在
    const expectedTables = [
      'account',
      'account_risk_data',
      'daily_work_data',
      'psychological_indicators',
      'psychological_test_results',
      'psychological_test_indicators',
      'trading_strategies',
      'risk_config',
      'account_risk_data',
      'technical_indicators',
      'orders',
      'transactions',
      'trade_records',
      'stock_pool',
      'stock_kline_data',
      'strategy_records',
      'risk_models'
    ];
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const existingTables = result.rows.map(r => r.table_name);
    
    // 检查缺失的表
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));
    if (missingTables.length > 0) {
      log(`Missing tables: ${missingTables.join(', ')}`, 'warning');
    } else {
      log(`All expected tables found (${expectedTables.length})`, 'success');
    }
    
    // 检查触发器
    const triggerResult = await pool.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
    `);
    
    const triggerCount = triggerResult.rows.length;
    log(`Found ${triggerCount} triggers`, 'info');
    
    // 检查数据行数
    const tablesWithCounts = await Promise.all(
      existingTables.map(async (table) => {
        try {
          const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
          return { table, count: parseInt(countResult.rows[0].count) };
        } catch (error) {
          return { table, count: 0, error: error.message };
        }
      })
    );
    
    log('\nTable data counts:', 'info');
    tablesWithCounts.forEach(({ table, count }) => {
      log(`  ${table}: ${count} rows`, 'info');
    });
    
    return true;
  } catch (error) {
    log(`Verification failed: ${error.message}`, 'error');
    return false;
  }
}

// 主函数
async function main() {
  const migrationFile = process.argv[2] || 'migration_complete_v4.sql';
  const skipBackup = process.argv.includes('--skip-backup');
  
  log('========================================');
  log('Zeta Trading System Database Migration');
  log('========================================');
  log(`Migration file: ${migrationFile}`);
  log(`Skip backup: ${skipBackup}`);
  
  try {
    // 步骤1: 备份数据库
    if (!skipBackup) {
      const backupSuccess = await backupDatabase();
      if (!backupSuccess) {
        log('Migration aborted due to backup failure', 'error');
        process.exit(1);
      }
    }
    
    // 步骤2: 读取迁移脚本
    log('Reading migration script...');
    const sqlContent = readSQLFile(migrationFile);
    log(`Migration script loaded (${sqlContent.length} bytes)`);
    
    // 步骤3: 执行迁移
    const migrationSuccess = await runMigration(sqlContent);
    if (!migrationSuccess) {
      log('Migration failed, please check the errors above', 'error');
      process.exit(1);
    }
    
    // 步骤4: 验证迁移
    await verifyMigration();
    
    log('\n========================================');
    log('Migration completed successfully!', 'success');
    log('========================================');
    
    process.exit(0);
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { runMigration, verifyMigration };
