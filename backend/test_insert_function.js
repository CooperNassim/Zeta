const { insert } = require('./src/database/queries');

async function test() {
  console.log('=== 直接测试 insert 函数 ===\n');

  const data = {
    date: '2026-03-31',
    nasdaq: '200',
    sentiment: '过热',
    prediction: '看涨',
    trade_status: '积极地',
    deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log('插入数据:', JSON.stringify(data, null, 2));

  try {
    const result = await insert('daily_work_data', data);
    console.log('\n✅ 插入成功');
    console.log('ID:', result.id);
    console.log('nasdaq:', result.nasdaq);
  } catch (error) {
    console.log('\n❌ 插入失败:', error.message);
  }
}

test();
