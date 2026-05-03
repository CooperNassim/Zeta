require('dotenv').config();
const { pool } = require('../config/database');

// 允许的表名白名单
const ALLOWED_TABLES = [
  'account', 'account_risk_data', 'daily_work_data', 'orders', 'transactions',
  'trading_strategies', 'strategy_records', 'trade_records', 'trade_orders', 'technical_indicators',
  'stock_pool', 'stock_kline_data', 'scheduled_orders', 'risk_config', 'risk_models',
  'psychological_indicators', 'psychological_test_results', 'psychological_test_indicators'
];

// 允许的排序字段（简单验证）
const ALLOWED_SORT_DIRECTIONS = ['ASC', 'DESC'];

// 验证并清理表名
const validateTableName = (table) => {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error(`Invalid table name: ${table}`);
  }
  return table;
};

// 验证并清理 orderBy 参数
const validateOrderBy = (orderBy) => {
  if (!orderBy) return null;
  
  // 简单的白名单验证：只允许字母、数字、下划线、空格、逗号
  const safeOrderBy = orderBy.replace(/[^a-zA-Z0-9_, ]/g, '');
  
  // 额外验证，防止恶意注入
  const parts = safeOrderBy.split(',').map(part => part.trim());
  const validatedParts = parts.map(part => {
    const [col, dir] = part.split(/\s+/);
    const cleanCol = col.replace(/[^a-zA-Z0-9_]/g, '');
    const cleanDir = dir ? (ALLOWED_SORT_DIRECTIONS.includes(dir.toUpperCase()) ? dir.toUpperCase() : 'ASC') : 'ASC';
    return `${cleanCol} ${cleanDir}`;
  });
  
  return validatedParts.join(', ');
};

// 验证 limit/offset
const validateNumber = (value, max = 1000) => {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 0) return null;
  return Math.min(num, max);
};

// 查询构建器 - 动态构建SQL查询
const buildQuery = (table, options = {}) => {
  // 验证表名
  const safeTable = validateTableName(table);
  
  let query = `SELECT * FROM ${safeTable}`;
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  // WHERE条件
  if (options.where) {
    for (const [key, value] of Object.entries(options.where)) {
      // 简单的列名验证，只允许字母、数字、下划线
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '');
      conditions.push(`${safeKey} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  // 自动过滤已删除的记录（除非明确指定 includeDeleted）
  const tablesWithDeleted = ['orders', 'transactions', 'daily_work_data', 'trade_records', 'stock_pool', 'trading_strategies', 'strategy_records'];
  if (!options.includeDeleted && tablesWithDeleted.includes(safeTable)) {
    conditions.push(`deleted = false`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // ORDER BY - 安全处理
  const safeOrderBy = validateOrderBy(options.orderBy);
  if (safeOrderBy) {
    query += ` ORDER BY ${safeOrderBy}`;
  }

  // LIMIT - 安全处理
  const safeLimit = validateNumber(options.limit, 1000);
  if (safeLimit) {
    query += ` LIMIT ${safeLimit}`;
  }

  // OFFSET - 安全处理
  const safeOffset = validateNumber(options.offset, 100000);
  if (safeOffset) {
    query += ` OFFSET ${safeOffset}`;
  }

  return { query, params };
};

// 查询数据
const findAll = async (table, options = {}) => {
  const { query, params } = buildQuery(table, options);
  const result = await pool.query(query, params);
  return result.rows;
};

// 查询单条数据
const findOne = async (table, options = {}) => {
  const { query, params } = buildQuery(table, { ...options, limit: 1 });
  const result = await pool.query(query, params);
  return result.rows[0] || null;
};

// 根据ID查询
const findById = async (table, id) => {
  const safeTable = validateTableName(table);
  const result = await pool.query(`SELECT * FROM ${safeTable} WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

// 插入数据（智能处理已删除数据）
const insert = async (table, data) => {
  const safeTable = validateTableName(table);
  const columns = Object.keys(data).map(key => key.replace(/[^a-zA-Z0-9_]/g, ''));
  const values = Object.values(data);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  // 对于 daily_work_data 表，检查是否有相同日期的已删除数据
  if (safeTable === 'daily_work_data' && data.date) {
    try {
      const checkResult = await pool.query(
        `SELECT * FROM ${safeTable} WHERE date = $1 AND deleted = true`,
        [data.date]
      );

      if (checkResult.rows.length > 0) {
        // 找到已删除的数据，恢复它
        const deletedRecord = checkResult.rows[0];
        const updateColumns = columns.filter(key => key !== 'deleted' && key !== 'deleted_at' && key !== 'created_at');
        const updateValues = updateColumns.map(key => data[key]);

        const updateQuery = `
          UPDATE ${safeTable}
          SET ${updateColumns.map((col, i) => `${col} = $${i + 2}`).join(', ')},
              deleted = false,
              deleted_at = null,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `;

        const updateResult = await pool.query(updateQuery, [deletedRecord.id, ...updateValues]);
        console.log(`[Database] 恢复已删除数据: date=${data.date}, id=${deletedRecord.id}`);
        return updateResult.rows[0];
      }
    } catch (error) {
      console.error('[Database] 检查已删除数据失败:', error);
    }
  }

  // 普通插入
  const query = `
    INSERT INTO ${safeTable} (${columns.join(', ')})
    VALUES (${placeholders})
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};

// 批量插入数据
const bulkInsert = async (table, dataArray) => {
  if (!dataArray || dataArray.length === 0) return [];

  const safeTable = validateTableName(table);
  const columns = Object.keys(dataArray[0]).map(key => key.replace(/[^a-zA-Z0-9_]/g, ''));
  const placeholders = dataArray.map((_, i) =>
    `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`
  ).join(', ');

  const values = dataArray.flatMap(data => Object.values(data));

  const query = `
    INSERT INTO ${safeTable} (${columns.join(', ')})
    VALUES ${placeholders}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

// 更新数据
const update = async (table, id, data) => {
  const safeTable = validateTableName(table);
  const updates = Object.entries(data)
    .map(([key, value], index) => {
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '');
      return `${safeKey} = $${index + 2}`;
    })
    .join(', ');

  const query = `
    UPDATE ${safeTable}
    SET ${updates}
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [id, ...Object.values(data)]);
  return result.rows[0] || null;
};

// 删除数据（软删除，如果没有deleted字段则硬删除）
const remove = async (table, id) => {
  const safeTable = validateTableName(table);
  try {
    const result = await pool.query(
      `UPDATE ${safeTable} SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  } catch (err) {
    // 如果表没有deleted字段，改用硬删除
    if (err.message.includes('deleted')) {
      const result = await pool.query(
        `DELETE FROM ${safeTable} WHERE id = $1 RETURNING *`,
        [id]
      );
      return result.rows[0] || null;
    }
    throw err;
  }
};

// 批量删除（软删除，如果没有deleted字段则硬删除）
const bulkDelete = async (table, ids) => {
  const safeTable = validateTableName(table);
  try {
    const result = await pool.query(
      `UPDATE ${safeTable} SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ANY($1) RETURNING *`,
      [ids]
    );
    return result.rows;
  } catch (err) {
    // 如果表没有deleted字段，改用硬删除
    if (err.message.includes('deleted')) {
      const result = await pool.query(
        `DELETE FROM ${safeTable} WHERE id = ANY($1) RETURNING *`,
        [ids]
      );
      return result.rows;
    }
    throw err;
  }
};

// 永久删除（硬删除）
const permanentDelete = async (table, id) => {
  const safeTable = validateTableName(table);
  const result = await pool.query(`DELETE FROM ${safeTable} WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0] || null;
};

// 批量永久删除（硬删除）
const bulkPermanentDelete = async (table, ids) => {
  const safeTable = validateTableName(table);
  const result = await pool.query(
    `DELETE FROM ${safeTable} WHERE id = ANY($1) RETURNING *`,
    [ids]
  );
  return result.rows;
};

// 恢复已删除的数据
const restore = async (table, id) => {
  const safeTable = validateTableName(table);
  const result = await pool.query(
    `UPDATE ${safeTable} SET deleted = false, deleted_at = NULL WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

// 批量恢复已删除的数据
const bulkRestore = async (table, ids) => {
  const safeTable = validateTableName(table);
  const result = await pool.query(
    `UPDATE ${safeTable} SET deleted = false, deleted_at = NULL WHERE id = ANY($1) RETURNING *`,
    [ids]
  );
  return result.rows;
};

// 执行原始查询
const query = async (sql, params = []) => {
  const result = await pool.query(sql, params);
  return result.rows;
};

// 执行事务
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  buildQuery,
  findAll,
  findOne,
  findById,
  insert,
  bulkInsert,
  update,
  remove,
  bulkDelete,
  query,
  transaction
};
