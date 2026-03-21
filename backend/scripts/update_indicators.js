const { pool } = require('../src/config/database');

async function updateIndicators() {
  try {
    // 更新心理指标的 min_score 和 max_score 为 0-2
    await pool.query(`
      UPDATE psychological_indicators
      SET min_score = 0, max_score = 2
      WHERE id IN (1, 2, 3, 4, 5)
    `);

    console.log('指标配置已更新为 0-2 分制');

    // 查询验证
    const result = await pool.query('SELECT * FROM psychological_indicators');
    console.log('更新后的指标:');
    console.log(JSON.stringify(result.rows, null, 2));

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await pool.end();
  }
}

updateIndicators();
