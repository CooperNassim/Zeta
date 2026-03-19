const { pool } = require('./src/config/database');

async function test() {
  console.log('=== 最终测试：完整模拟前端操作 ===\n');

  // 清理
  await pool.query("DELETE FROM daily_work_data WHERE date::text LIKE '2026-03-31%'");

  // 步骤1：创建
  console.log('【步骤1】创建数据');
  const now = new Date().toISOString();
  const data = {
    date: '2026-03-31',
    nasdaq: '100',
    sentiment: '微热',
    prediction: '看涨',
    trade_status: '积极地',
    deleted: false,
    created_at: now,
    updated_at: now
  };

  let columns = Object.keys(data);
  let values = Object.values(data);
  let placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  // 过滤自动生成字段
  const autoFields = ['id', 'created_at', 'updated_at', 'deleted_at'];
  const filteredData = {};
  for (const key of columns) {
    if (!autoFields.includes(key)) {
      filteredData[key] = data[key];
    }
  }
  columns = Object.keys(filteredData);
  values = Object.values(filteredData);
  placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  console.log('  列:', columns);
  console.log('  占位符:', placeholders);

  const query = `INSERT INTO daily_work_data (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
  console.log('  SQL:', query);

  const result = await pool.query(query, values);
  console.log('  ✅ 创建成功，ID:', result.rows[0].id);

  const createdId = result.rows[0].id;

  // 步骤2：删除
  console.log('\n【步骤2】删除数据');
  await pool.query("UPDATE daily_work_data SET deleted = true WHERE id = $1", [createdId]);
  console.log('  ✅ 删除成功');

  // 步骤3：检查已删除数据
  console.log('\n【步骤3】检查已删除数据');
  const checkResult = await pool.query(
    "SELECT * FROM daily_work_data WHERE date::text = $1 AND deleted = true",
    ['2026-03-31']
  );
  console.log('  找到已删除记录数:', checkResult.rows.length);

  // 步骤4：重新创建
  console.log('\n【步骤4】重新创建数据');
  const recreateData = {
    ...data,
    nasdaq: '200',
    sentiment: '过热'
  };

  // 过滤
  columns = Object.keys(recreateData);
  values = Object.values(recreateData);
  placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  const filteredRecreate = {};
  for (const key of columns) {
    if (!autoFields.includes(key)) {
      filteredRecreate[key] = recreateData[key];
    }
  }
  columns = Object.keys(filteredRecreate);
  values = Object.values(filteredRecreate);
  placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  console.log('  列:', columns);

  try {
    const insertResult = await pool.query(`INSERT INTO daily_work_data (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
    console.log('  ❌ 插入成功（不应该成功）');
  } catch (error) {
    console.log('  ❌ 插入失败（这是预期的）:', error.message);
  }

  await pool.end();
}

test();
