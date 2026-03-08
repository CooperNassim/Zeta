require('dotenv').config();
const { pool } = require('../config/database');

// 查询构建器 - 动态构建SQL查询
const buildQuery = (table, options = {}) => {
  let query = `SELECT * FROM ${table}`;
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  // WHERE条件
  if (options.where) {
    for (const [key, value] of Object.entries(options.where)) {
      conditions.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  // 默认过滤已删除记录（除非显式包含已删除）
  if (!options.includeDeleted) {
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

// 查询数据
const findAll = async (table, options = {}) => {
  const { query, params } = buildQuery(table, options);
  const result = await pool.query(query, params);
  return result.rows;
};

// 查询单条数据
const findOne = async (table, options = {}) => {
  const { query, params } = buildQuery({ ...options, limit: 1 });
  const result = await pool.query(query, params);
  return result.rows[0] || null;
};

// 根据ID查询
const findById = async (table, id) => {
  const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

// 插入数据
const insert = async (table, data) => {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  const query = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${placeholders})
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};

// 批量插入数据
const bulkInsert = async (table, dataArray) => {
  if (!dataArray || dataArray.length === 0) return [];

  const columns = Object.keys(dataArray[0]);
  const placeholders = dataArray.map((_, i) =>
    `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`
  ).join(', ');

  const values = dataArray.flatMap(data => Object.values(data));

  const query = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES ${placeholders}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

// 更新数据
const update = async (table, id, data) => {
  const updates = Object.entries(data)
    .map(([key, value], index) => `${key} = $${index + 2}`)
    .join(', ');

  const query = `
    UPDATE ${table}
    SET ${updates}
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [id, ...Object.values(data)]);
  return result.rows[0] || null;
};

// 删除数据（软删除）
const remove = async (table, id) => {
  const result = await pool.query(
    `UPDATE ${table} SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

// 批量删除（软删除）
const bulkDelete = async (table, ids) => {
  const result = await pool.query(
    `UPDATE ${table} SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ANY($1) RETURNING *`,
    [ids]
  );
  return result.rows;
};

// 永久删除（硬删除）
const permanentDelete = async (table, id) => {
  const result = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0] || null;
};

// 批量永久删除（硬删除）
const bulkPermanentDelete = async (table, ids) => {
  const result = await pool.query(
    `DELETE FROM ${table} WHERE id = ANY($1) RETURNING *`,
    [ids]
  );
  return result.rows;
};

// 恢复已删除的数据
const restore = async (table, id) => {
  const result = await pool.query(
    `UPDATE ${table} SET deleted = false, deleted_at = NULL WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

// 批量恢复已删除的数据
const bulkRestore = async (table, ids) => {
  const result = await pool.query(
    `UPDATE ${table} SET deleted = false, deleted_at = NULL WHERE id = ANY($1) RETURNING *`,
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
