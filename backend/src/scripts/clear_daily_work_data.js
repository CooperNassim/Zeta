const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'zeta_trading',
  password: '960717',
  port: 5432,
});

(async () => {
  try {
    console.log('开始删除 daily_work_data 表中的所有数据...');
    
    // 硬删除所有记录（包括软删除的）
    const result = await pool.query('DELETE FROM daily_work_data');
    
    console.log(`✓ 已删除 ${result.rowCount} 条记录`);
    
    await pool.end();
    console.log('操作完成');
  } catch (error) {
    console.error('删除失败:', error);
    await pool.end();
    process.exit(1);
  }
})();
