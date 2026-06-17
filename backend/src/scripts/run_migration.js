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

// 确保 schema_migrations 表存在
async function ensureMigrationsTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'success'
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_filename 
      ON schema_migrations(filename)
    `);
    log('schema_migrations 表已就绪');
  } finally {
    client.release();
  }
}

// 获取已执行的迁移文件名列表
async function getExecutedMigrations() {
  const result = await pool.query(`
    SELECT filename FROM schema_migrations 
    WHERE status = 'success' 
    ORDER BY filename
  `);
  return result.rows.map(row => row.filename);
}

// 扫描 migrations 目录，按文件名排序
function scanMigrationFiles() {
  const migrationsDir = path.join(__dirname, '../../migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }
  
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql') && !file.startsWith('README'))
    .sort(); // 按文件名字母顺序排序，确保执行顺序
  
  return files;
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

// 执行单个迁移文件的 SQL 语句
async function runSingleMigration(filename) {
  const client = await pool.connect();
  const startTime = Date.now();
  
  try {
    const sqlContent = readSQLFile(filename);
    
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
        if (!error.message.includes('does not exist') && !error.message.includes('already exists')) {
          log(`  Statement ${executed + 1} warning: ${error.message}`, 'warning');
        }
      }
    }
    
    // 提交事务
    await client.query('COMMIT');
    
    const executionTime = Date.now() - startTime;
    
    // 记录执行历史
    await client.query(`
      INSERT INTO schema_migrations (filename, execution_time_ms, status)
      VALUES ($1, $2, 'success')
      ON CONFLICT (filename) DO NOTHING
    `, [filename, executionTime]);
    
    return { success: true, executed, executionTime };
  } catch (error) {
    // 回滚事务
    await client.query('ROLLBACK');
    
    const executionTime = Date.now() - startTime;
    
    // 记录失败历史
    try {
      await client.query(`
        INSERT INTO schema_migrations (filename, execution_time_ms, status)
        VALUES ($1, $2, 'failed')
        ON CONFLICT (filename) DO UPDATE SET status = 'failed', execution_time_ms = $2
      `, [filename, executionTime]);
    } catch (recordError) {
      log(`  Failed to record migration status: ${recordError.message}`, 'warning');
    }
    
    return { success: false, error: error.message, executionTime };
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
      'orders',
      'transactions',
      'trade_records',
      'strategy_records',
      'risk_models',
      'schema_migrations'
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

// 显示迁移状态
async function showMigrationStatus() {
  log('Migration Status');
  log('================');
  
  await ensureMigrationsTable();
  
  const allFiles = scanMigrationFiles();
  const executedFiles = await getExecutedMigrations();
  
  // 获取详细的执行信息
  const result = await pool.query(`
    SELECT filename, executed_at, execution_time_ms, status 
    FROM schema_migrations 
    ORDER BY filename
  `);
  const executedMap = {};
  result.rows.forEach(row => {
    executedMap[row.filename] = {
      executed_at: row.executed_at,
      execution_time_ms: row.execution_time_ms,
      status: row.status
    };
  });
  
  let executedCount = 0;
  let pendingCount = 0;
  let failedCount = 0;
  
  allFiles.forEach(file => {
    if (executedMap[file]) {
      const info = executedMap[file];
      if (info.status === 'success') {
        log(`  ✓ ${file} (executed at ${new Date(info.executed_at).toLocaleString('zh-CN')}, ${info.execution_time_ms}ms)`, 'success');
        executedCount++;
      } else {
        log(`  ✗ ${file} (FAILED at ${new Date(info.executed_at).toLocaleString('zh-CN')})`, 'error');
        failedCount++;
      }
    } else {
      log(`  ○ ${file} (pending)`, 'info');
      pendingCount++;
    }
  });
  
  log('\n================');
  log(`Total: ${allFiles.length} | Executed: ${executedCount} | Failed: ${failedCount} | Pending: ${pendingCount}`);
  
  return { executedCount, pendingCount, failedCount };
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const skipBackup = args.includes('--skip-backup');
  const showStatus = args.includes('--status');
  const targetFile = args.find(arg => !arg.startsWith('--')); // 第一个非 -- 开头的参数视为文件名
  
  log('========================================');
  log('Zeta Trading System Database Migration');
  log('========================================');
  
  try {
    // 步骤1: 确保 migrations 表存在
    await ensureMigrationsTable();
    
    // 显示状态模式
    if (showStatus) {
      await showMigrationStatus();
      process.exit(0);
    }
    
    // 如果指定了单个文件，执行那个文件
    if (targetFile) {
      log(`Executing single migration: ${targetFile}`);
      const result = await runSingleMigration(targetFile);
      if (!result.success) {
        log(`Migration failed: ${result.error}`, 'error');
        process.exit(1);
      }
      log(`Migration completed in ${result.executionTime}ms`, 'success');
      process.exit(0);
    }
    
    // 步骤2: 备份数据库
    if (!skipBackup) {
      const backupSuccess = await backupDatabase();
      if (!backupSuccess) {
        log('Migration aborted due to backup failure', 'error');
        process.exit(1);
      }
    }
    
    // 步骤3: 扫描所有迁移文件
    const allFiles = scanMigrationFiles();
    log(`Found ${allFiles.length} migration files`);
    
    // 步骤4: 获取已执行的迁移
    const executedFiles = await getExecutedMigrations();
    log(`Already executed: ${executedFiles.length} migrations`);
    
    // 步骤5: 找出未执行的迁移文件
    const pendingFiles = allFiles.filter(f => !executedFiles.includes(f));
    
    if (pendingFiles.length === 0) {
      log('All migrations are up to date! No pending migrations.', 'success');
      process.exit(0);
    }
    
    log(`Pending migrations: ${pendingFiles.length}`, 'info');
    pendingFiles.forEach((f, i) => log(`  ${i + 1}. ${f}`));
    
    // 步骤6: 按顺序执行未执行的迁移
    let successCount = 0;
    let failedCount = 0;
    
    for (const filename of pendingFiles) {
      log(`\n--- Executing: ${filename} ---`);
      const result = await runSingleMigration(filename);
      
      if (result.success) {
        log(`  ✓ Completed in ${result.executionTime}ms (${result.executed} statements)`, 'success');
        successCount++;
      } else {
        log(`  ✗ Failed: ${result.error}`, 'error');
        failedCount++;
        log('Migration stopped due to error', 'error');
        break; // 遇到错误就停止，防止后续依赖问题
      }
    }
    
    // 步骤7: 验证迁移
    await verifyMigration();
    
    log('\n========================================');
    log(`Migration summary: ${successCount} succeeded, ${failedCount} failed`, failedCount > 0 ? 'warning' : 'success');
    log('========================================');
    
    if (failedCount > 0) {
      process.exit(1);
    }
    
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

module.exports = { runSingleMigration, verifyMigration, scanMigrationFiles, getExecutedMigrations };
