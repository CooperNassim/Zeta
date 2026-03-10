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

  // 自动过滤已删除的记录（除非明确指定 includeDeleted）
  // 只对包含 deleted 字段的表进行过滤
  const tablesWithDeleted = ['orders', 'daily_work_data', 'psychological_tests', 'trade_records', 'stock_pool'];
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

// 插入数据（智能处理已删除数据）
const insert = async (table, data) => {
  let columns = Object.keys(data);
  let values = Object.values(data);
  let placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  // 对于 daily_work_data 表，处理日期字段避免时区问题
  let processedData = { ...data };
  if (table === 'daily_work_data' && data.date) {
    // 将日期转换为字符串格式 YYYY-MM-DD，避免时区问题
    let dateStr = data.date;
    if (data.date instanceof Date) {
      const year = data.date.getFullYear();
      const month = String(data.date.getMonth() + 1).padStart(2, '0');
      const day = String(data.date.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    }
    processedData.date = dateStr;

    // 检查是否有相同日期的已删除数据
    try {
      console.log(`[Database] 检查已删除数据，日期: ${dateStr}`);
      const checkResult = await pool.query(
        `SELECT * FROM ${table} WHERE date::text = $1 AND deleted = true`,
        [dateStr]
      );
      console.log(`[Database] 检查结果: 找到 ${checkResult.rows.length} 条已删除记录`);

      if (checkResult.rows.length > 0) {
        // 找到已删除的数据，恢复它
        const deletedRecord = checkResult.rows[0];
        const updateColumns = Object.keys(processedData).filter(key =>
          key !== 'deleted' && key !== 'deleted_at' && key !== 'created_at' && key !== 'updated_at'
        );
        const updateValues = updateColumns.map(key => processedData[key]);
        const updatePlaceholders = updateColumns.map((_, i) => `$${i + 2}`).join(', ');

        const updateQuery = `
          UPDATE ${table}
          SET ${updateColumns.map((col, i) => `${col} = $${i + 2}`).join(', ')},
              deleted = false,
              deleted_at = null,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `;

        const updateResult = await pool.query(updateQuery, [deletedRecord.id, ...updateValues]);
        console.log(`[Database] 恢复已删除数据: date=${dateStr}, id=${deletedRecord.id}`);
        return updateResult.rows[0];
      }
    } catch (error) {
      console.error('[Database] 检查已删除数据失败:', error);
    }
  }

  // 使用处理后的数据
  columns = Object.keys(processedData);
  values = Object.values(processedData);
  placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  // 对于 daily_work_data 表，过滤掉自动生成的字段
  if (table === 'daily_work_data') {
    const autoFields = ['id', 'created_at', 'updated_at', 'deleted_at'];
    const filteredData = {};

    for (const key of columns) {
      if (!autoFields.includes(key)) {
        filteredData[key] = processedData[key];
      }
    }

    columns = Object.keys(filteredData);
    values = Object.values(filteredData);
    placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
  }

  // 普通插入
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
  // 对于 daily_work_data 表，处理日期变更
  if (table === 'daily_work_data' && data.date) {
    // 格式化日期
    let dateStr = data.date;
    if (data.date instanceof Date) {
      const year = data.date.getFullYear();
      const month = String(data.date.getMonth() + 1).padStart(2, '0');
      const day = String(data.date.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    }
    
    // 获取当前记录的日期
    const currentRecord = await pool.query(
      `SELECT id, date FROM ${table} WHERE id = $1`,
      [id]
    );
    
    if (currentRecord.rows.length === 0) {
      return null;
    }
    
    const currentRecordData = currentRecord.rows[0];
    // 使用本地时区获取日期
    const currentDateObj = new Date(currentRecordData.date);
    const currentDateStr = `${currentDateObj.getFullYear()}-${String(currentDateObj.getMonth() + 1).padStart(2, '0')}-${String(currentDateObj.getDate()).padStart(2, '0')}`;
    
    // 如果日期没有变化，正常更新
    if (currentDateStr === dateStr) {
      return await performUpdate(table, id, data);
    }
    
    // 日期有变化，检查新日期是否存在
    const existingRecord = await pool.query(
      `SELECT id, deleted FROM ${table} WHERE date::text = $1`,
      [dateStr]
    );
    
    if (existingRecord.rows.length > 0) {
      const existing = existingRecord.rows[0];
      
      if (!existing.deleted) {
        // 新日期已存在且未删除，报错
        throw new Error(`日期 ${dateStr} 已存在`);
      } else {
        // 新日期已删除，软删除当前记录并恢复已删除的新日期记录
        console.log(`[Update] 软删除当前记录 id=${id}, date=${currentDateStr}`);
        await pool.query(
          `UPDATE ${table} SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [id]
        );
        
        // 恢复已删除的新日期记录
        console.log(`[Update] 恢复已删除记录 id=${existing.id}, date=${dateStr}`);
        const updateColumns = Object.keys(data).filter(key =>
          key !== 'deleted' && key !== 'deleted_at' && key !== 'created_at' && key !== 'updated_at' && key !== 'id'
        );
        const updateValues = updateColumns.map(key => key === 'date' ? dateStr : data[key]);
        const updatePlaceholders = updateColumns.map((_, i) => `$${i + 2}`).join(', ');
        
        const updateQuery = `
          UPDATE ${table}
          SET ${updateColumns.map((col, i) => `${col} = $${i + 2}`).join(', ')},
              deleted = false,
              deleted_at = null,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `;
        
        const updateResult = await pool.query(updateQuery, [existing.id, ...updateValues]);
        let rowData = updateResult.rows[0];
        
        // 转换返回的日期格式
        if (rowData && rowData.date) {
          const dateObj = new Date(rowData.date);
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          rowData.date = `${year}-${month}-${day}`;
        }
        
        return rowData;
      }
    }
    
    // 新日期不存在，正常更新
    return await performUpdate(table, id, { ...data, date: dateStr });
  }
  
  // 非daily_work_data表或无日期字段，正常更新
  return await performUpdate(table, id, data);
};

// 执行普通更新的辅助函数
const performUpdate = async (table, id, data) => {
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
  let rowData = result.rows[0] || null;

  // 对于 daily_work_data 表，转换返回的日期格式以避免时区问题
  if (table === 'daily_work_data' && rowData && rowData.date) {
    const dateObj = new Date(rowData.date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    rowData.date = `${year}-${month}-${day}`;
  }

  return rowData;
};

// 删除数据（软删除，如果没有deleted字段则硬删除）
const remove = async (table, id) => {
  try {
    const result = await pool.query(
      `UPDATE ${table} SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  } catch (err) {
    // 如果表没有deleted字段，改用硬删除
    if (err.message.includes('deleted')) {
      const result = await pool.query(
        `DELETE FROM ${table} WHERE id = $1 RETURNING *`,
        [id]
      );
      return result.rows[0] || null;
    }
    throw err;
  }
};

// 批量删除（软删除，如果没有deleted字段则硬删除）
const bulkDelete = async (table, ids) => {
  try {
    const result = await pool.query(
      `UPDATE ${table} SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ANY($1) RETURNING *`,
      [ids]
    );
    return result.rows;
  } catch (err) {
    // 如果表没有deleted字段，改用硬删除
    if (err.message.includes('deleted')) {
      const result = await pool.query(
        `DELETE FROM ${table} WHERE id = ANY($1) RETURNING *`,
        [ids]
      );
      return result.rows;
    }
    throw err;
  }
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
