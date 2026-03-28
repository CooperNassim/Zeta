const { Pool } = require('pg');
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

// 验证数据库结构
async function verifyDatabase() {
  log('========================================');
  log('Database Verification Report');
  log('========================================\n');
  
  try {
    // 1. 检查所有表
    log('1. Checking tables...', 'info');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(r => r.table_name);
    log(`   Found ${tables.length} tables`, 'success');
    tables.forEach(table => log(`   - ${table}`, 'info'));
    
    // 2. 检查触发器
    log('\n2. Checking triggers...', 'info');
    const triggersResult = await pool.query(`
      SELECT event_object_table, trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);
    
    const triggers = triggersResult.rows;
    log(`   Found ${triggers.length} triggers`, 'success');
    
    // 按表分组显示触发器
    const triggersByTable = {};
    triggers.forEach(t => {
      if (!triggersByTable[t.event_object_table]) {
        triggersByTable[t.event_object_table] = [];
      }
      triggersByTable[t.event_object_table].push(t.trigger_name);
    });
    
    Object.keys(triggersByTable).forEach(table => {
      log(`   ${table}:`, 'info');
      triggersByTable[table].forEach(trigger => {
        log(`     - ${trigger}`, 'info');
      });
    });
    
    // 3. 检查函数
    log('\n3. Checking functions...', 'info');
    const functionsResult = await pool.query(`
      SELECT routine_name, routine_type 
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      ORDER BY routine_name
    `);
    
    const functions = functionsResult.rows;
    log(`   Found ${functions.length} functions`, 'success');
    functions.forEach(f => log(`   - ${f.routine_name} (${f.routine_type})`, 'info'));
    
    // 4. 检查数据行数
    log('\n4. Checking data counts...', 'info');
    const dataCounts = await Promise.all(
      tables.map(async (table) => {
        try {
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
          const count = parseInt(countResult.rows[0].count);
          return { table, count };
        } catch (error) {
          return { table, count: 0, error: error.message };
        }
      })
    );
    
    const totalRows = dataCounts.reduce((sum, item) => sum + (item.count || 0), 0);
    log(`   Total rows across all tables: ${totalRows}`, 'success');
    
    dataCounts.forEach(({ table, count }) => {
      if (count > 0) {
        log(`   - ${table}: ${count} rows`, 'info');
      }
    });
    
    // 5. 检查索引
    log('\n5. Checking indexes...', 'info');
    const indexesResult = await pool.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    const indexes = indexesResult.rows;
    log(`   Found ${indexes.length} indexes`, 'success');
    
    const indexesByTable = {};
    indexes.forEach(idx => {
      if (!indexesByTable[idx.tablename]) {
        indexesByTable[idx.tablename] = [];
      }
      indexesByTable[idx.tablename].push(idx.indexname);
    });
    
    Object.keys(indexesByTable).forEach(table => {
      log(`   ${table}: ${indexesByTable[table].length} indexes`, 'info');
    });
    
    // 6. 验证 V4 规范
    log('\n6. Validating V4 compliance...', 'info');
    
    const v4Tables = [
      'account',
      'account_risk_data',
      'daily_work_data',
      'psychological_indicators',
      'psychological_test_results',
      'psychological_test_indicators',
      'trading_strategies',
      'risk_config',
      'technical_indicators',
      'orders',
      'transactions',
      'trade_records',
      'stock_pool',
      'stock_kline_data',
      'strategy_records',
      'risk_models'
    ];
    
    const missingTables = v4Tables.filter(t => !tables.includes(t));
    const extraTables = tables.filter(t => !v4Tables.includes(t));
    
    if (missingTables.length > 0) {
      log(`   Missing V4 tables: ${missingTables.join(', ')}`, 'warning');
    } else {
      log(`   All V4 tables present (${v4Tables.length})`, 'success');
    }
    
    if (extraTables.length > 0) {
      log(`   Extra tables (not in V4): ${extraTables.join(', ')}`, 'warning');
    }
    
    // 7. 检查软删除字段
    log('\n7. Checking soft delete support...', 'info');
    const tablesWithSoftDelete = await Promise.all(
      tables.map(async (table) => {
        try {
          const columnsResult = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = $1
            AND column_name IN ('deleted', 'deleted_at')
          `, [table]);
          
          return { table, hasSoftDelete: columnsResult.rows.length > 0 };
        } catch (error) {
          return { table, hasSoftDelete: false, error: error.message };
        }
      })
    );
    
    const tablesWithSoftDeleteCount = tablesWithSoftDelete.filter(t => t.hasSoftDelete).length;
    log(`   ${tablesWithSoftDeleteCount}/${tables.length} tables have soft delete support`, 'info');
    
    // 8. 检查时间字段类型
    log('\n8. Checking timestamp types...', 'info');
    const timestampColumns = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND data_type IN ('timestamp with time zone', 'timestamp without time zone')
      ORDER BY table_name, column_name
    `);
    
    const timestamptzCount = timestampColumns.rows.filter(c => c.data_type === 'timestamp with time zone').length;
    const timestampCount = timestampColumns.rows.filter(c => c.data_type === 'timestamp without time zone').length;
    
    log(`   TIMESTAMPTZ columns: ${timestamptzCount}`, timestamptzCount > 0 ? 'success' : 'warning');
    log(`   TIMESTAMP columns: ${timestampCount}`, timestampCount === 0 ? 'success' : 'warning');
    
    // 总结
    log('\n========================================');
    log('Verification Summary', 'success');
    log('========================================');
    log(`Tables: ${tables.length}`);
    log(`Triggers: ${triggers.length}`);
    log(`Functions: ${functions.length}`);
    log(`Indexes: ${indexes.length}`);
    log(`Total Data Rows: ${totalRows}`);
    log(`V4 Tables Present: ${v4Tables.length - missingTables.length}/${v4Tables.length}`);
    log(`Soft Delete Support: ${tablesWithSoftDeleteCount}/${tables.length}`);
    log(`TIMESTAMPTZ Columns: ${timestamptzCount}`);
    log('========================================\n');
    
    // 返回验证结果
    return {
      success: missingTables.length === 0,
      tables,
      triggers: triggers.length,
      functions: functions.length,
      totalRows,
      missingTables,
      extraTables,
      hasSoftDelete: tablesWithSoftDeleteCount > 0,
      usesTimestamptz: timestamptzCount > 0
    };
    
  } catch (error) {
    log(`Verification failed: ${error.message}`, 'error');
    console.error(error);
    return { success: false, error: error.message };
  } finally {
    await pool.end();
  }
}

// 主函数
async function main() {
  const result = await verifyDatabase();
  
  if (result.success) {
    log('Database is V4 compliant!', 'success');
    process.exit(0);
  } else {
    log('Database is not V4 compliant', 'warning');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { verifyDatabase };
