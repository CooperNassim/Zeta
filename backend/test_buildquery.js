const buildQuery = (table, options = {}) => {
  let query = `SELECT * FROM ${table}`;
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  // WHERE条件
  if (options.where) {
    for (const [key, value] of Object.entries(options.where)) {
      console.log(`Adding condition: ${key} = ${value}`);
      conditions.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  // 自动过滤已删除的记录（除非明确指定 includeDeleted）
  // 只对包含 deleted 字段的表进行过滤
  const tablesWithDeleted = ['orders', 'daily_work_data', 'psychological_test_results', 'trade_records', 'stock_pool'];
  if (!options.includeDeleted && tablesWithDeleted.includes(table)) {
    conditions.push(`deleted = false`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // ORDER BY
  if (options.orderBy) {
    query += ` ORDER BY ${options.orderBy}`;
  }

  // LIMIT
  if (options.limit) {
    query += ` LIMIT ${options.limit}`;
  }

  // OFFSET
  if (options.offset) {
    query += ` OFFSET ${options.offset}`;
  }

  return { query, params };
};

// 测试
const options = { where: { test_date: '2026-03-13' }, limit: 1 };
console.log('Options:', JSON.stringify(options, null, 2));
const { query, params } = buildQuery('psychological_test_results', options);
console.log('Query:', query);
console.log('Params:', params);
