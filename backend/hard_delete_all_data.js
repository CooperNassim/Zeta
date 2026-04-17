require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('=== 硬删除股票交易、交易记录、账单明细数据 ===\n');

    // 定义要删除的表
    const tables = [
      { name: 'trade_records', label: '交易记录' },
      { name: 'transactions', label: '账单明细' },
      { name: 'trade_orders', label: '股票交易' }
    ];

    for (const table of tables) {
      console.log(`1. 处理 ${table.label} 表 (${table.name}):`);
      
      // 先查看表中现有数据
      const countResult = await client.query(`
        SELECT COUNT(*) as count
        FROM ${table.name}
      `);
      const count = parseInt(countResult.rows[0].count);
      console.log(`   表中现有 ${count} 条数据`);

      if (count > 0) {
        // 执行硬删除
        const deleteResult = await client.query(`
          DELETE FROM ${table.name}
        `);
        console.log(`   成功删除 ${deleteResult.rowCount} 条数据`);
      } else {
        console.log(`   表中无数据，跳过删除`);
      }

      // 验证删除结果
      const verifyResult = await client.query(`
        SELECT COUNT(*) as count
        FROM ${table.name}
      `);
      const verifyCount = parseInt(verifyResult.rows[0].count);
      console.log(`   删除后剩余 ${verifyCount} 条数据\n`);
    }

    console.log('✅ 操作完成！所有表的数据已硬删除');
    console.log('您现在可以重新创建数据进行测试了。');

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();