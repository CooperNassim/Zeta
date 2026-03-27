const { pool } = require('./src/config/database');

async function checkTriggers() {
  try {
    // 查询trade_orders表上的所有触发器
    const triggersQuery = `
      SELECT 
        tgname as trigger_name,
        proname as function_name,
        tgenabled as enabled,
        pg_get_triggerdef(pg_trigger.oid) as definition
      FROM pg_trigger
      JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
      WHERE tgrelid = 'trade_orders'::regclass
        AND tgname NOT LIKE 'RI_%'
      ORDER BY tgname;
    `;
    
    const result = await pool.query(triggersQuery);
    
    console.log('=== Trade Orders 表上的触发器 ===\n');
    
    const triggerGroups = {};
    result.rows.forEach(row => {
      const name = row.trigger_name;
      if (!triggerGroups[name]) {
        triggerGroups[name] = [];
      }
      triggerGroups[name].push(row);
    });
    
    // 找出重复的触发器
    console.log('重复的触发器：');
    Object.entries(triggerGroups).forEach(([name, triggers]) => {
      if (triggers.length > 1) {
        console.log(`\n⚠️  ${name} (${triggers.length}个):`);
        triggers.forEach((t, idx) => {
          console.log(`   ${idx + 1}. ${t.function_name} - ${t.enabled === 'O' ? '启用' : '禁用'}`);
        });
      }
    });
    
    console.log('\n\n所有触发器详情：');
    result.rows.forEach((row, idx) => {
      console.log(`\n${idx + 1}. ${row.trigger_name} (${row.function_name})`);
      console.log(`   状态: ${row.enabled === 'O' ? '启用' : '禁用'}`);
      console.log(`   定义: ${row.definition.substring(0, 100)}...`);
    });
    
    // 统计
    console.log('\n\n=== 统计 ===');
    console.log(`总触发器数: ${result.rows.length}`);
    console.log(`唯一触发器名: ${Object.keys(triggerGroups).length}`);
    console.log(`重复触发器: ${Object.entries(triggerGroups).filter(([k, v]) => v.length > 1).length}`);
    
    process.exit();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkTriggers();
