const { pool } = require('./src/config/database');

async function fixStockPoolTable() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('🔧 修复stock_pool表结构...');
    
    // 检查是否已经存在current_price字段
    const checkField = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stock_pool' AND column_name = 'current_price'
    `);
    
    if (checkField.rows.length === 0) {
      // 添加缺失的字段
      console.log('添加current_price字段...');
      await client.query(`
        ALTER TABLE stock_pool 
        ADD COLUMN current_price DECIMAL(10,4) DEFAULT 0,
        ADD COLUMN change_percent DECIMAL(8,4) DEFAULT 0,
        ADD COLUMN exchange VARCHAR(20) DEFAULT ''
      `);
      console.log('✅ 字段添加完成');
    } else {
      console.log('字段已存在，无需修改');
    }
    
    await client.query('COMMIT');
    console.log('✅ stock_pool表结构修复完成');
    
    // 验证表结构
    console.log('\n🔍 验证修复后的表结构...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'stock_pool'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 stock_pool表字段列表:');
    result.rows.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type})`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('修复表结构失败:', error);
  } finally {
    client.release();
  }
}

fixStockPoolTable().catch(console.error);