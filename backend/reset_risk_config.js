const { pool } = require('./src/config/database');

async function resetRiskConfig() {
  try {
    await pool.query(
      `UPDATE risk_config SET total_risk_percent = 6, single_risk_percent = 2 WHERE id IN (1, 2)`
    );
    console.log('数据已重置为默认值');

    const result = await pool.query('SELECT * FROM risk_config');
    console.table(result.rows);

  } catch (error) {
    console.error('重置失败:', error);
  } finally {
    pool.end();
  }
}

resetRiskConfig();
