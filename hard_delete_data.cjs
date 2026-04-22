require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

const hardDeleteAllData = async () => {
  const client = await pool.connect();

  try {
    console.log('🔍 开始执行硬删除...\n');

    // 表格删除顺序（考虑外键关系）
    const tables = [
      'daily_work_data',      // 每日功课
      'trade_records',        // 交易记录
      'transactions',         // 账单明细
      'stock_pool'            // 股票记录
    ];

    for (const table of tables) {
      // 先查询当前数据量
      const beforeResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
      const count = beforeResult.rows[0].count;

      if (count > 0) {
        // 执行硬删除
        await client.query(`DELETE FROM ${table}`);
        console.log(`✅ ${table}: 删除了 ${count} 条数据`);
      } else {
        console.log(`⏭️  ${table}: 无数据，跳过`);
      }
    }

    console.log('\n🎉 硬删除完成！');

    // 验证删除结果
    console.log('\n📊 删除后数据统计:');
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`   ${table}: ${result.rows[0].count} 条`);
    }

  } catch (error) {
    console.error('❌ 硬删除失败:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

hardDeleteAllData()
  .then(() => {
    console.log('\n✅ 脚本执行成功');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ 脚本执行失败:', err);
    process.exit(1);
  });
