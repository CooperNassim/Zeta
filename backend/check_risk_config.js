const { pool } = require('./src/config/database');

async function checkRiskConfig() {
  const client = await pool.connect();
  try {
    // 查询表结构
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'risk_config'
      ORDER BY ordinal_position
    `);
    console.log('表结构:');
    console.table(columns.rows);

    // 查询现有数据
    const data = await client.query('SELECT * FROM risk_config');
    console.log('\n现有数据:');
    console.table(data.rows);

  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    client.release();
    pool.end();
  }
}

checkRiskConfig();
