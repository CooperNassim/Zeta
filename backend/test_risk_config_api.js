const { pool } = require('./src/config/database');

async function testRiskConfigAPI() {
  try {
    // 模拟 findAll 函数调用
    const result = await pool.query('SELECT * FROM risk_config');
    console.log('查询结果:');
    console.table(result.rows);

    // 测试更新操作
    const updateResult = await pool.query(
      `UPDATE risk_config SET total_risk_percent = $1, single_risk_percent = $2 WHERE id = $3 RETURNING *`,
      [7, 3, 1]
    );
    console.log('\n更新结果:');
    console.table(updateResult.rows);

    // 验证更新
    const verifyResult = await pool.query('SELECT * FROM risk_config WHERE id = 1');
    console.log('\n验证结果:');
    console.table(verifyResult.rows);

  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    pool.end();
  }
}

testRiskConfigAPI();
