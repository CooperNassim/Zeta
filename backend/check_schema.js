const { pool } = require('./src/config/database');

(async () => {
  try {
    const result = await pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position', ['daily_work_data']);
    console.log('Columns:', result.rows.map(r => r.column_name).join(', '));

    // 检查是否有 deleted 字段
    const deletedCheck = result.rows.find(r => r.column_name === 'deleted');
    console.log('\nDeleted field exists:', !!deletedCheck);

    // 查看示例数据
    const sampleData = await pool.query('SELECT * FROM daily_work_data LIMIT 1');
    if (sampleData.rows.length > 0) {
      console.log('\nSample data:', JSON.stringify(sampleData.rows[0], null, 2));
    }

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
