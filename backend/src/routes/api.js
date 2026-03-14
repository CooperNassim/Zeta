const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const {
  findAll,
  findOne,
  findById,
  insert,
  bulkInsert,
  update,
  remove,
  bulkDelete,
  permanentDelete,
  bulkPermanentDelete,
  restore,
  bulkRestore,
  query
} = require('../database/queries');

// 特殊路由（必须在通用CRUD路由之前）

// GET /api/test - 测试路由
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Test route works!' });
});

// GET /api/sync - 同步数据（从数据库获取所有数据）
router.get('/sync/all', async (req, res) => {
  try {
    const tables = [
      'account',
      'daily_work_data',
      'psychological_test_results',
      'psychological_test_indicators',
      'trading_strategies',
      'risk_models',
      'risk_config',
      'account_risk_data',
      'technical_indicators',
      'orders',
      'transactions',
      'trade_records',
      'stock_pool',
      'stock_kline_data',
      'strategy_records',
      'scheduled_orders'
    ];

    const syncData = {};

    for (const table of tables) {
      try {
        const data = await findAll(table);
        syncData[table] = data;
      } catch (err) {
        console.error(`Sync error for table ${table}:`, err.message);
        syncData[table] = [];
      }
    }

    res.json({
      success: true,
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: syncData
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/export - 导出所有数据
router.get('/export/all', async (req, res) => {
  try {
    const tables = [
      'account',
      'daily_work_data',
      'psychological_test_results',
      'psychological_test_indicators',
      'trading_strategies',
      'risk_models',
      'risk_config',
      'account_risk_data',
      'technical_indicators',
      'orders',
      'transactions',
      'trade_records',
      'stock_pool',
      'stock_kline_data',
      'strategy_records'
    ];

    const allData = {};
    for (const table of tables) {
      try {
        allData[table] = await findAll(table);
      } catch (err) {
        allData[table] = [];
      }
    }

    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: allData
    };

    const filename = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    const backupDir = path.join(__dirname, '..', '..', 'backups');
    const filepath = path.join(backupDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

    res.json({ success: true, filename, data: backup });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/import - 导入数据
router.post('/import/all', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid data format' });
    }

    const results = {};

    for (const [table, records] of Object.entries(data)) {
      if (!Array.isArray(records)) continue;

      results[table] = { imported: 0, errors: [] };

      for (const record of records) {
        try {
          await insert(table, record);
          results[table].imported++;
        } catch (err) {
          results[table].errors.push({ record, error: err.message });
        }
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 通用CRUD路由

// GET /api/:table - 获取列表
router.get('/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { where, orderBy, limit, offset, includeDeleted } = req.query;

    const options = {};
    if (where) options.where = JSON.parse(where);
    if (orderBy) options.orderBy = orderBy;
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);
    if (includeDeleted === 'true') options.includeDeleted = true;

    let data = await findAll(table, options);

    // 对于 daily_work_data 表，转换日期格式以避免时区问题
    if (table === 'daily_work_data') {
      data = data.map(row => {
        if (row.date) {
          const dateObj = new Date(row.date);
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          row.date = `${year}-${month}-${day}`;
        }
        return row;
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('GET error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/:table/:id - 获取单条
router.get('/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    let data = await findById(table, id);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    // 对于 daily_work_data 表，转换日期格式以避免时区问题
    if (table === 'daily_work_data' && data.date) {
      const dateObj = new Date(data.date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      data.date = `${year}-${month}-${day}`;
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('GET by id error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/psychological_test_indicators - 获取0-2分心理测试指标配置
router.get('/psychological_test_indicators', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, min_score, max_score, weight, sort_order FROM psychological_test_indicators WHERE deleted = false AND is_active = true ORDER BY sort_order'
    );
    const indicators = result.rows.map(row => ({
      id: String(row.id),
      dbId: row.id,
      name: row.name,
      description: row.description,
      minScore: parseFloat(row.min_score),
      maxScore: parseFloat(row.max_score),
      weight: parseFloat(row.weight)
    }));
    res.json({ success: true, data: indicators });
  } catch (error) {
    console.error('GET psychological_test_indicators error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/psychological_test_indicators/:id - 更新心理测试指标
router.put('/psychological_test_indicators/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const result = await pool.query(
      `UPDATE psychological_test_indicators
       SET name = $1, description = $2, min_score = $3, max_score = $4, weight = $5, sort_order = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND deleted = false
       RETURNING *`,
      [data.name, data.description || '', data.minScore || 0, data.maxScore || 2, data.weight || 0.2, data.sortOrder || 0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: '指标不存在' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('PUT psychological_test_indicators error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/psychological_test_results/by-date/:date - 按日期更新心理测试结果
// 注意：这个路由必须在 POST /:table 之前，否则会被错误匹配
router.put('/psychological_test_results/by-date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const data = req.body;

    const result = await pool.query(
      `UPDATE psychological_test_results
       SET score = $1, overall_score = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
       WHERE test_date = $4 AND deleted = false
       RETURNING *`,
      [JSON.stringify(data.scores), data.overall_score, data.notes || '', date]
    );

    if (result.rows.length === 0) {
      // 如果没有找到记录，创建新记录
      const insertResult = await pool.query(
        `INSERT INTO psychological_test_results (test_date, score, overall_score, notes, deleted, deleted_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [date, JSON.stringify(data.scores), data.overall_score, data.notes || '']
      );
      // 转换日期格式，同时添加 scores 字段以匹配前端
      const responseData = {
        ...insertResult.rows[0],
        test_date: formatToLocalDateString(insertResult.rows[0].test_date),
        scores: insertResult.rows[0].score
      };
      return res.json({ success: true, data: responseData });
    }

    // 转换日期格式，同时添加 scores 字段以匹配前端
    const responseData = {
      ...result.rows[0],
      test_date: formatToLocalDateString(result.rows[0].test_date),
      scores: result.rows[0].score
    };
    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('PUT by-date error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 格式化日期为本地时间字符串 YYYY-MM-DD
function formatToLocalDateString(date) {
  if (!date) return null;
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// POST /api/:table - 创建
router.post('/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const data = req.body;

    const result = await insert(table, data);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('POST error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/:table/bulk/delete - 批量删除（支持 id 或 date）
// 注意：这个路由必须在 /:table/bulk 之前，否则会被错误匹配
router.post('/:table/bulk/delete', async (req, res) => {
  console.log('[BULK DELETE] 路由被调用 v3!');
  console.log('[BULK DELETE] 请求路径:', req.path);
  try {
    const { table } = req.params;
    const { ids, dates } = req.body;

    console.log('[BULK DELETE] table:', table);
    console.log('[BULK DELETE] req.body:', req.body);
    console.log('[BULK DELETE] ids:', ids);
    console.log('[BULK DELETE] dates:', dates);

    let results = []

    // 按 id 删除
    if (ids && Array.isArray(ids)) {
      console.log('[BULK DELETE] 按ID删除, ids:', ids);
      results = await bulkDelete(table, ids);
    }

    // 按日期删除（针对 daily_work_data 等用日期作为唯一标识的表）
    if (dates && Array.isArray(dates) && table === 'daily_work_data') {
      console.log('[BULK DELETE] 按日期删除, dates:', dates);
      for (const date of dates) {
        const result = await pool.query(
          `UPDATE ${table} SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE date = $1 RETURNING *`,
          [date]
        );
        if (result.rows.length > 0) {
          results.push(...result.rows);
        }
      }
    }

    console.log('[BULK DELETE] results count:', results.length);
    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    console.error('[BULK DELETE error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/:table/bulk - 批量创建
router.post('/:table/bulk', async (req, res, next) => {
  // 如果路径是 /:table/bulk/delete，跳过这个路由
  if (req.path.endsWith('/delete')) {
    return next('route');
  }

  try {
    const { table } = req.params;
    const dataArray = req.body;

    if (!Array.isArray(dataArray)) {
      return res.status(400).json({ success: false, error: 'Data must be an array' });
    }

    const results = await bulkInsert(table, dataArray);
    res.status(201).json({ success: true, data: results, count: results.length });
  } catch (error) {
    console.error('BULK POST error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/:table/:id - 更新
router.put('/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    const data = req.body;

    const result = await update(table, id, data);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('PUT error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/:table/:id - 删除
router.delete('/:table/:id', async (req, res, next) => {
  // 如果 id 是 'bulk',跳过这个路由,让下一个路由处理
  if (req.params.id === 'bulk') {
    return next('route');
  }

  try {
    const { table, id } = req.params;
    const result = await remove(table, id);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('DELETE error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/:table/:id/restore - 恢复已删除的数据
router.patch('/:table/:id/restore', async (req, res) => {
  try {
    const { table, id } = req.params;
    const result = await restore(table, id);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('RESTORE error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/:table/bulk/restore - 批量恢复已删除的数据
router.patch('/:table/bulk/restore', async (req, res) => {
  try {
    const { table } = req.params;
    const { ids } = req.body;

    if (!Array.isArray(ids)) {
      return res.status(400).json({ success: false, error: 'ids must be an array' });
    }

    const results = await bulkRestore(table, ids);
    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    console.error('BULK RESTORE error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/:table/:id/permanent - 永久删除（硬删除）
router.delete('/:table/:id/permanent', async (req, res) => {
  try {
    const { table, id } = req.params;
    const result = await permanentDelete(table, id);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('PERMANENT DELETE error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/:table/bulk/permanent - 批量永久删除（硬删除）
router.delete('/:table/bulk/permanent', async (req, res) => {
  try {
    const { table } = req.params;
    const { ids } = req.body;

    if (!Array.isArray(ids)) {
      return res.status(400).json({ success: false, error: 'ids must be an array' });
    }

    const results = await bulkPermanentDelete(table, ids);
    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    console.error('BULK PERMANENT DELETE error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
