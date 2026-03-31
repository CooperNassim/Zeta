/**
 * 检查风险配置表中的数据
 */
const { pool } = require('./src/config/database');

async function checkRiskConfig() {
  const client = await pool.connect();
  
  try {
    console.log('========================================');
    console.log('检查 risk_config 表数据');
    console.log('========================================\n');

    // 检查表是否存在
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'risk_config'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ risk_config 表不存在\n');
      return;
    }
    
    console.log('✅ risk_config 表存在\n');

    // 查询所有数据
    const result = await client.query('SELECT * FROM risk_config ORDER BY id');
    
    if (result.rows.length === 0) {
      console.log('⚠️  risk_config 表为空\n');
    } else {
      console.log(`找到 ${result.rows.length} 条记录:\n`);
      result.rows.forEach((row, index) => {
        console.log(`记录 ${index + 1}:`);
        console.log(`  ID: ${row.id}`);
        console.log(`  账户类型: ${row.account_type}`);
        console.log(`  总风险额度: ${row.total_risk_percent}%`);
        console.log(`  单笔风险额度: ${row.single_risk_percent}%`);
        console.log(`  已删除: ${row.deleted}`);
        console.log(`  创建时间: ${row.created_at}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ 执行出错:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkRiskConfig();
