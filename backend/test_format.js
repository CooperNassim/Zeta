const { pool } = require('./src/config/database');

// 统一日期字段为北京时间字符串格式
const formatDates = (data, table) => {
  if (!data) return null;

  const dateFields = {
    'daily_work_data': ['date'],
    'psychological_test_results': ['test_date']
  };

  const fieldsToFormat = dateFields[table] || [];

  const toBeijingString = (date) => {
    const beijingOffset = 8 * 60 * 60 * 1000;
    const beijingDate = new Date(date.getTime() + beijingOffset);
    return beijingDate.toISOString().replace('Z', '+08:00');
  };

  const formatSingle = (row) => {
    if (!row) return null;
    const formatted = { ...row };
    fieldsToFormat.forEach(field => {
      if (row[field]) {
        if (row[field] instanceof Date) {
          formatted[field] = toBeijingString(row[field]);
        } else if (typeof row[field] === 'string') {
          const date = new Date(row[field]);
          if (!isNaN(date.getTime())) {
            formatted[field] = toBeijingString(date);
          }
        }
      }
    });
    return formatted;
  };

  if (Array.isArray(data)) {
    return data.map(formatSingle);
  }
  return formatSingle(data);
};

(async () => {
  const result = await pool.query('SELECT id, test_date, overall_score, scores FROM psychological_test_results WHERE deleted = false ORDER BY id DESC LIMIT 3');
  const formatted = formatDates(result.rows, 'psychological_test_results');
  console.log('格式化后的数据:');
  formatted.forEach(r => {
    console.log(JSON.stringify({
      id: r.id,
      test_date: r.test_date,
      test_date_type: typeof r.test_date,
      overall_score: r.overall_score
    }, null, 2));
  });
  await pool.end();
})();
