const { pool } = require('./src/config/database');
const fs = require('fs');

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 开始执行风险配置表迁移...');
    
    // 读取SQL文件
    const sql = fs.readFileSync('./add_risk_fields.sql', 'utf8');
    console.log('📄 迁移SQL内容:');
    console.log(sql);
    
    // 执行SQL
    await client.query(sql);
    console.log('✅ SQL执行成功！');
    
    // 验证新字段
    console.log('🔍 验证新字段...');
    const verifyResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'risk_config'
      AND column_name IN ('start_month_total', 'account_available', 'single_available')
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ 新字段创建成功：');
      verifyResult.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('⚠️ 未找到新字段，可能是表不存在或字段已存在');
    }
    
    // 检查表结构
    console.log('\n📊 完整表结构：');
    const tableStructure = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'risk_config'
      ORDER BY ordinal_position
    `);
    
    tableStructure.rows.forEach(row => {
      console.log(`   ${row.column_name.padEnd(25)} ${row.data_type.padEnd(15)} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n🎉 迁移完成！');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);