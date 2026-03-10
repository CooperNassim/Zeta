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

// GET /api/sync - 同步数据（从数据库获取所有数据）
router.get('/sync/all', async (req, res) => {
  try {
    const tables = [
      'account',
      'daily_work_data',
      'psychological_indicators',
      'psychological_tests',
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
      'psychological_indicators',
      'psychological_tests',
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

    const data = await findAll(table, options);
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
    const data = await findById(table, id);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error('GET by id error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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

// POST /api/:table/bulk - 批量创建
router.post('/:table/bulk', async (req, res) => {
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
router.delete('/:table/:id', async (req, res) => {
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

// DELETE /api/:table/bulk - 批量删除（支持 id 或 date）
router.delete('/:table/bulk', async (req, res) => {
  try {
    const { table } = req.params;
    const { ids, dates } = req.body;

    let results = []
    
    // 按 id 删除
    if (ids && Array.isArray(ids)) {
      results = await bulkDelete(table, ids);
    }
    
    // 按日期删除（针对 daily_work_data 等用日期作为唯一标识的表）
    if (dates && Array.isArray(dates) && table === 'daily_work_data') {
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
    
    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    console.error('BULK DELETE error:', error);
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
