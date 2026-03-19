const { pool } = require('./src/config/database');

async function verify() {
  try {
    const result = await pool.query('SELECT * FROM psychological_test_results WHERE deleted = false ORDER BY id DESC LIMIT 1');
    if (result.rows.length === 0) {
      console.log('❌ 数据库中没有数据');
    } else {
      const row = result.rows[0];
      console.log('✅ 数据库最新记录:');
      console.log('  ID:', row.id);
      console.log('  日期:', row.test_date);
      console.log('  分数:', JSON.stringify(row.scores, null, 2));
      console.log('  总分:', row.overall_score);
      console.log('\n分数验证:');
      const sum = Object.values(row.scores).reduce((a, b) => a + b, 0);
      console.log('  分数总和:', sum);
      console.log('  数据库总分:', parseFloat(row.overall_score));
      console.log('  是否一致:', sum === parseFloat(row.overall_score) ? '✅' : '❌');
    }
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await pool.end();
  }
}

verify();
