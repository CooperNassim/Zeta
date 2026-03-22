const { pool } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function executeMigration() {
  console.log('========================================');
  console.log('执行交易记录表迁移');
  console.log('========================================\n');

  try {
    // 1. 备份现有数据
    console.log('1. 备份现有数据...');
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS trade_records_backup_complete AS
        SELECT * FROM trade_records
      `);
      console.log('   ✅ 备份表创建成功');
    } catch (error) {
      console.log('   ⚠️  备份失败(可能表不存在):', error.message);
    }

    // 2. 删除现有表
    console.log('\n2. 删除现有表...');
    await pool.query('DROP TABLE IF EXISTS trade_records CASCADE');
    console.log('   ✅ 表删除成功');

    // 3. 读取迁移SQL文件
    console.log('\n3. 读取迁移SQL...');
    const sqlPath = path.join(__dirname, 'migrations/migration_trade_records_complete.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // 4. 提取CREATE TABLE语句(跳过备份和删除部分)
    console.log('\n4. 创建新表结构...');
    const createTableMatch = sqlContent.match(/CREATE TABLE trade_records \([^;]+\);/s);
    if (!createTableMatch) {
      throw new Error('无法找到CREATE TABLE语句');
    }

    await pool.query(createTableMatch[0]);
    console.log('   ✅ 表创建成功');

    // 5. 创建索引
    console.log('\n5. 创建索引...');
    const indexMatches = sqlContent.match(/CREATE INDEX[^;]+;/g);
    if (indexMatches) {
      for (const indexSql of indexMatches) {
        if (indexSql.includes('idx_trade_records')) {
          await pool.query(indexSql);
          console.log(`   ✅ ${indexSql.match(/idx_\w+/)[0]} 索引创建成功`);
        }
      }
    }

    // 6. 创建CHECK约束
    console.log('\n6. 创建CHECK约束...');
    const constraintMatches = sqlContent.match(/ALTER TABLE trade_records[^;]+CHECK[^;]+;/g);
    if (constraintMatches) {
      for (const constraintSql of constraintMatches) {
        await pool.query(constraintSql);
        console.log(`   ✅ 约束创建成功`);
      }
    }

    // 7. 创建触发器
    console.log('\n7. 创建触发器...');
    const triggerMatch = sqlContent.match(/CREATE TRIGGER[^;]+;/);
    if (triggerMatch) {
      await pool.query(triggerMatch[0]);
      console.log('   ✅ 触发器创建成功');
    }

    // 8. 添加注释
    console.log('\n8. 添加表和字段注释...');
    const commentMatches = sqlContent.match(/COMMENT ON[^;]+;/g);
    if (commentMatches) {
      for (const commentSql of commentMatches) {
        await pool.query(commentSql);
      }
      console.log('   ✅ 注释添加成功');
    }

    // 9. 验证表结构
    console.log('\n9. 验证表结构...');
    const columnCheck = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'trade_records'
      ORDER BY ordinal_position
    `);

    console.log(`   ✅ 表有 ${columnCheck.rows.length} 个字段`);

    const requiredFields = [
      'id', 'trade_number', 'trade_type', 'symbol', 'name',
      'buy_price', 'buy_quantity', 'buy_time',
      'sell_price', 'sell_quantity', 'sell_time',
      'deleted', 'deleted_at', 'created_at', 'updated_at'
    ];

    const existingFields = columnCheck.rows.map(row => row.column_name);
    const missingFields = requiredFields.filter(field => !existingFields.includes(field));

    if (missingFields.length > 0) {
      console.log(`   ❌ 缺少字段: ${missingFields.join(', ')}`);
    } else {
      console.log('   ✅ 所有必需字段都存在');
    }

    console.log('\n========================================');
    console.log('✅ 迁移完成!');
    console.log('========================================');

    console.log('\n📌 下一步:');
    console.log('   运行测试脚本: node test_trade_records_refactor.js');

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await pool.end();
  }
}

executeMigration().then(() => {
  console.log('\n程序结束');
  process.exit(0);
}).catch(error => {
  console.error('执行失败:', error);
  process.exit(1);
});
