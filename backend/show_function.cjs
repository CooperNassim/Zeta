const { pool } = require('./src/config/database');

(async () => {
  try {
    // 获取函数的完整定义
    const result = await pool.query(`
      SELECT 
        routine_name,
        routine_definition
      FROM information_schema.routines
      WHERE routine_type = 'FUNCTION'
        AND routine_name = 'sync_trade_order_to_records'
        AND routine_schema = 'public'
    `);
    
    if (result.rows.length > 0) {
      console.log('=== 触发器函数完整定义 ===\n');
      console.log(result.rows[0].routine_definition);
    } else {
      console.log('函数不存在');
    }
    
    await pool.end();
  } catch (error) {
    console.error('错误:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
