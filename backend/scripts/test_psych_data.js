const { pool } = require('../src/config/database');

async function testData() {
  try {
    // 插入测试数据
    const testScores = { '1': 2, '2': 1, '3': 2, '4': 1, '5': 2 };
    
    await pool.query(
      `INSERT INTO psychological_test_results (test_date, scores, overall_score)
       VALUES ($1, $2, $3)`,
      ['2026-03-21', JSON.stringify(testScores), 8.0]
    );
    
    console.log('测试数据已插入');
    
    // 查询数据
    const result = await pool.query(
      'SELECT * FROM psychological_test_results WHERE test_date = $1',
      ['2026-03-21']
    );
    
    console.log('查询结果:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await pool.end();
  }
}

testData();
