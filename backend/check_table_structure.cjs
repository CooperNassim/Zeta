const { pool } = require('./src/config/database');

(async () => {
  try {
    console.log('=== trade_records 表结构 ===\n');

    // 检查trade_records表结构
    const columns = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'trade_records'
      ORDER BY ordinal_position
    `);
    
    console.log('字段列表:');
    columns.rows.forEach(col => {
      const type = col.data_type + (col.character_maximum_length ? `(${col.character_maximum_length})` : '');
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`  - ${col.column_name}: ${type} ${nullable}${defaultVal}`);
    });

    // 检查触发器函数定义
    const funcDef = await pool.query(`
      SELECT 
        routine_name,
        routine_definition
      FROM information_schema.routines
      WHERE routine_type = 'FUNCTION'
        AND routine_name LIKE '%trade%'
        AND routine_schema = 'public'
    `);
    
    console.log('\n\n触发器函数定义:');
    if (funcDef.rows.length > 0) {
      funcDef.rows.forEach(f => {
        console.log(`\n函数名: ${f.routine_name}`);
        console.log('定义:');
        console.log(f.routine_definition);
      });
    } else {
      console.log('没有找到触发器函数');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
})();
