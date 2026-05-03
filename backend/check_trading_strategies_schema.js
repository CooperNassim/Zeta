const {pool} = require('./src/config/database');

(async () => {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'trading_strategies' 
      ORDER BY ordinal_position
    `);
    console.log('trading_strategies 字段:');
    res.rows.forEach(r => console.log(`  ${r.column_name} | ${r.data_type} | ${r.is_nullable}`));
    
    // 尝试查询数据
    const data = await pool.query('SELECT * FROM trading_strategies LIMIT 2');
    console.log('\n查询结果示例:');
    console.log(JSON.stringify(data.rows, null, 2));
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    pool.end();
  }
})();
