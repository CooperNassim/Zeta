const { pool } = require('./src/config/database');

(async () => {
  try {
    console.log('查询心理测试结果...\n');
    const res = await pool.query('SELECT * FROM psychological_test_results WHERE deleted = false ORDER BY test_date DESC LIMIT 5');
    console.log('心理测试结果数量:', res.rows.length);
    console.log('详细数据:');

    res.rows.forEach((row, index) => {
      console.log(`\n--- 记录 ${index + 1} ---`);
      console.log(`ID: ${row.id}`);
      // 将Date对象转换为本地日期字符串
      const testDate = new Date(row.test_date);
      const year = testDate.getFullYear();
      const month = String(testDate.getMonth() + 1).padStart(2, '0');
      const day = String(testDate.getDate()).padStart(2, '0');
      console.log(`测试日期: ${year}-${month}-${day}`);
      console.log(`分数: ${JSON.stringify(row.scores)}`);
      console.log(`总分: ${row.overall_score}`);
      console.log(`备注: ${row.notes || '无'}`);
      console.log(`创建时间: ${row.created_at}`);
      console.log(`更新时间: ${row.updated_at}`);
    });

    await pool.end();
  } catch(e) {
    console.error('Error:', e.message);
    console.error('Stack:', e.stack);
    await pool.end();
  }
})();
