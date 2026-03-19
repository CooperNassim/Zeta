const { pool } = require('./src/config/database');

(async () => {
  try {
    const res = await pool.query(
      "SELECT sequence_name FROM information_schema.sequences WHERE sequence_name LIKE '%trading%' ORDER BY sequence_name"
    );
    console.log('trading相关的序列:');
    res.rows.forEach(r => console.log(r.sequence_name));
    await pool.end();
  } catch (error) {
    console.error('错误:', error.message);
    await pool.end();
  }
})();
