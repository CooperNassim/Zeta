const { pool } = require('../src/config/database');

async function fixDateType() {
  try {
    console.log('修复 test_date 类型...');
    
    // 修改 test_date 列为 DATE 类型
    await pool.query(
      `ALTER TABLE psychological_test_results
       ALTER COLUMN test_date TYPE DATE USING test_date::DATE`
    );
    
    console.log('类型修改完成');
    
    // 查询验证
    const result = await pool.query(
      'SELECT * FROM psychological_test_results WHERE test_date = $1',
      ['2026-03-21']
    );
    
    console.log('验证结果:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await pool.end();
  }
}

fixDateType();
