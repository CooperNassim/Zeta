const { pool } = require('../src/config/database');

async function checkSchema() {
  try {
    const result = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'psychological_test_results' 
       ORDER BY ordinal_position`
    );
    console.log('心理测试结果表结构:');
    console.log(JSON.stringify(result.rows, null, 2));

    const result2 = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'psychological_indicators' 
       ORDER BY ordinal_position`
    );
    console.log('\n心理指标表结构:');
    console.log(JSON.stringify(result2.rows, null, 2));

    // 检查数据
    const count1 = await pool.query('SELECT COUNT(*) FROM psychological_test_results');
    const count2 = await pool.query('SELECT COUNT(*) FROM psychological_indicators');
    console.log(`\n心理测试结果记录数: ${count1.rows[0].count}`);
    console.log(`心理指标记录数: ${count2.rows[0].count}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();
