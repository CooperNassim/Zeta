const { pool } = require('./src/config/database');

async function test() {
  try {
    console.log('=== 检查数据库约束 ===\n');
    
    // 查看表的所有约束
    const constraints = await pool.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        cc.check_clause
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.table_name = 'daily_work_data'
      ORDER BY tc.constraint_type, tc.constraint_name
    `);
    
    console.log('约束列表:');
    console.log('------------------------');
    constraints.rows.forEach(c => {
      console.log(`类型: ${c.constraint_type}`);
      console.log(`名称: ${c.constraint_name}`);
      console.log(`列: ${c.column_name || '-'}`);
      console.log(`检查: ${c.check_clause || '-'}`);
      console.log('------------------------');
    });
    
    // 查看可用的枚举值
    console.log('\n=== 查看实际数据中的预测值 ===');
    const predictions = await pool.query(`
      SELECT DISTINCT prediction FROM daily_work_data WHERE prediction IS NOT NULL
    `);
    console.log('预测值:', predictions.rows.map(r => r.prediction));
    
    console.log('\n=== 查看实际数据中的情绪值 ===');
    const sentiments = await pool.query(`
      SELECT DISTINCT sentiment FROM daily_work_data WHERE sentiment IS NOT NULL
    `);
    console.log('情绪值:', sentiments.rows.map(r => r.sentiment));
    
    console.log('\n=== 查看实际数据中的交易状态值 ===');
    const statuses = await pool.query(`
      SELECT DISTINCT trade_status FROM daily_work_data WHERE trade_status IS NOT NULL
    `);
    console.log('交易状态值:', statuses.rows.map(r => r.trade_status));
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await pool.end();
  }
}

test();
