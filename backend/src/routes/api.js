const express = require('express');
const path = require('path');
const fs = require('fs');
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

const NODE_ENV = process.env.NODE_ENV || 'development';

// 安全错误响应
const safeError = (error) => {
  console.error('API Error:', error);
  if (NODE_ENV === 'production') {
    return { success: false, error: 'Internal server error' };
  }
  return { success: false, error: error.message };
};

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
      'psychological_indicators',
      'psychological_test_results',
      'trading_strategies',
      'risk_config',
      'technical_indicators',
      'orders',
      'transactions',
      'trade_records',
      'trade_orders',
      'stock_pool',
      'stock_kline_data',
      'strategy_records'
    ];

    const syncData = {};

    for (const table of tables) {
      try {
        // 包含软删除的数据，以便前端能正确计算最大交易编号
        // 心理测试指标需要按ID排序，确保顺序一致
        const options = { includeDeleted: true };
        if (table === 'psychological_indicators') {
          options.orderBy = 'id ASC';
        }
        const data = await findAll(table, options);
        // 特殊处理日期格式，转换为 YYYY-MM-DD 字符串
        if (table === 'psychological_test_results') {
          syncData[table] = data.map(item => ({
            ...item,
            test_date: item.test_date ? (() => {
              const dateObj = new Date(item.test_date);
              const year = dateObj.getFullYear();
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const day = String(dateObj.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            })() : null,
            date: item.test_date ? (() => {
              const dateObj = new Date(item.test_date);
              const year = dateObj.getFullYear();
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const day = String(dateObj.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            })() : null,
            scores: item.indicators,
            overall_score: item.total_score
          }));
        } else if (table === 'daily_work_data') {
          syncData[table] = data.map(item => ({
            ...item,
            date: item.date ? (() => {
              const dateObj = new Date(item.date);
              const year = dateObj.getFullYear();
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const day = String(dateObj.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            })() : null
          }));
        } else {
          syncData[table] = data;
        }
      } catch (err) {
        console.error(`Sync error for table ${table}:`, err.message);
        syncData[table] = null; // 返回 null 而不是空数组，避免覆盖前端数据
      }
    }

    res.json({
      success: true,
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: syncData
    });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// 心理测试结果专用路由 - 必须在通用 /:table 路由之前
router.get('/psychological_test_results/by-date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const result = await pool.query(
      'SELECT * FROM psychological_test_results WHERE test_date = $1',
      [date]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

router.post('/psychological_test_results', async (req, res) => {
  try {
    const { test_date, scores, overall_score } = req.body;

    const result = await pool.query(
      `INSERT INTO psychological_test_results (test_date, indicators, total_score, user_id)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (test_date) DO UPDATE
       SET indicators = EXCLUDED.indicators, total_score = EXCLUDED.total_score, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [test_date, JSON.stringify(scores), parseFloat(overall_score)]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[POST /psychological_test_results] Error:', error);
    res.status(500).json(safeError(error));
  }
});

router.put('/psychological_test_results/by-date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { scores, overall_score } = req.body;

    const result = await pool.query(
      `UPDATE psychological_test_results
       SET indicators = $1, total_score = $2, updated_at = CURRENT_TIMESTAMP
       WHERE test_date = $3
       RETURNING *`,
      [JSON.stringify(scores), overall_score, date]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[PUT /psychological_test_results] Error:', error);
    res.status(500).json(safeError(error));
  }
});

// POST /api/:table/bulk/delete - 批量删除（支持 id 或 date）
// 注意：这个路由必须在 /:table/bulk 之前，否则会被错误匹配
router.post('/:table/bulk/delete', async (req, res) => {
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
          'UPDATE daily_work_data SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE date = $1 RETURNING *',
          [date]
        );
        if (result.rows.length > 0) {
          results.push(...result.rows);
        }
      }
    }

    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    res.status(500).json(safeError(error));
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
    res.status(500).json(safeError(error));
  }
});

// ===================== 数据库管理专用路由 =====================

// GET /api/database/info - 获取数据库基础信息
router.get('/database/info', async (req, res) => {
  try {
    const dbInfo = {};
    
    const version = await pool.query('SELECT version()');
    dbInfo.version = version.rows[0].version;

    const size = await pool.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    dbInfo.size = size.rows[0].size;

    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    dbInfo.tableCount = tables.rows.length;

    const tableDetails = [];
    for (const t of tables.rows) {
      const count = await pool.query(`SELECT count(*) FROM "${t.table_name}"`);
      const deletedCount = await pool.query(
        `SELECT count(*) FROM "${t.table_name}" WHERE deleted = true`
      ).catch(() => ({ rows: [{ count: '0' }] }));
      tableDetails.push({
        name: t.table_name,
        totalRows: parseInt(count.rows[0].count),
        deletedRows: parseInt(deletedCount.rows[0].count)
      });
    }
    dbInfo.tables = tableDetails;

    const connectionCount = await pool.query(`
      SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()
    `);
    dbInfo.activeConnections = parseInt(connectionCount.rows[0].count);

    const uptime = await pool.query(`
      SELECT date_trunc('second', current_timestamp - pg_postmaster_start_time()) as uptime
    `);
    dbInfo.uptime = uptime.rows[0].uptime;

    res.json({ success: true, data: dbInfo });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// POST /api/database/restart - 重启数据库连接池
router.post('/database/restart', async (req, res) => {
  try {
    await pool.end();
    await pool.connect();
    res.json({ success: true, message: '数据库连接池已重启' });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// GET /api/database/backups - 获取备份列表
router.get('/database/backups', async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      return res.json({ success: true, data: [] });
    }
    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.sql') || f.endsWith('.gz'))
      .map(f => {
        const stats = fs.statSync(path.join(backupDir, f));
        return {
          name: f,
          size: stats.size,
          created: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    res.json({ success: true, data: files });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// POST /api/database/backup - 创建备份
router.post('/database/backup', async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `backup_${timestamp}.sql`;
    const filePath = path.join(backupDir, fileName);

    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    `);

    let sql = `-- Zeta Trading System Database Backup\n-- Date: ${timestamp}\n\n`;

    for (const t of tables.rows) {
      const data = await pool.query(`SELECT * FROM "${t.table_name}"`);
      if (data.rows.length === 0) continue;

      const columns = Object.keys(data.rows[0]);
      sql += `-- Table: ${t.table_name}\n`;
      sql += `DELETE FROM "${t.table_name}";\n`;

      for (const row of data.rows) {
        const values = columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number') return val;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        sql += `INSERT INTO "${t.table_name}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
      }
      sql += '\n';
    }

    fs.writeFileSync(filePath, sql, 'utf8');

    res.json({ success: true, message: '备份成功', data: { fileName, size: sql.length } });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// DELETE /api/database/backup/:filename - 删除备份文件
router.delete('/database/backup/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '..', 'backups', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: '备份文件不存在' });
    }
    
    fs.unlinkSync(filePath);
    res.json({ success: true, message: '备份文件已删除' });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// POST /api/database/restore - 从备份恢复
router.post('/database/restore', async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, error: '请指定备份文件名' });
    }

    const filePath = path.join(__dirname, '..', 'backups', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: '备份文件不存在' });
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));

    for (const stmt of statements) {
      await pool.query(stmt.trim());
    }

    res.json({ success: true, message: '数据恢复成功' });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// POST /api/database/cleanup - 清理数据库
router.post('/database/cleanup', async (req, res) => {
  try {
    const { type } = req.body;

    let results = {};

    switch (type) {
      case 'soft-deleted': {
        const tables = await pool.query(`
          SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
        `);
        let totalDeleted = 0;
        for (const t of tables.rows) {
          try {
            const hasDeleted = await pool.query(
              `SELECT count(*) FROM information_schema.columns WHERE table_name = $1 AND column_name = 'deleted'`,
              [t.table_name]
            );
            if (parseInt(hasDeleted.rows[0].count) > 0) {
              const result = await pool.query(
                `DELETE FROM "${t.table_name}" WHERE deleted = true`
              );
              const count = parseInt(result.rowCount || 0);
              if (count > 0) {
                results[t.table_name] = count;
                totalDeleted += count;
              }
            }
          } catch (e) { /* 忽略错误 */ }
        }
        results.totalDeleted = totalDeleted;
        break;
      }
      case 'all-data': {
        const tables = await pool.query(`
          SELECT table_name FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name NOT IN ('schema_migrations')
        `);
        for (const t of tables.rows) {
          await pool.query(`DELETE FROM "${t.table_name}"`);
          results[t.table_name] = 'cleared';
        }
        break;
      }
      default:
        return res.status(400).json({ success: false, error: '未知的清理类型' });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// POST /api/database/export - 导出数据库
router.post('/database/export', async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `export_${timestamp}.sql`;
    const backupDir = path.join(__dirname, '..', 'backups');

    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    `);

    let sql = `-- Zeta Trading System Database Export\n-- Date: ${timestamp}\n\n`;

    for (const t of tables.rows) {
      const data = await pool.query(`SELECT * FROM "${t.table_name}" WHERE deleted = false`);
      if (data.rows.length === 0) continue;

      const columns = Object.keys(data.rows[0]);
      sql += `-- Table: ${t.table_name} (${data.rows.length} rows)\n`;
      sql += `DELETE FROM "${t.table_name}";\n`;

      for (const row of data.rows) {
        const values = columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number') return val;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        sql += `INSERT INTO "${t.table_name}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
      }
      sql += '\n';
    }

    fs.mkdirSync(backupDir, { recursive: true });
    fs.writeFileSync(path.join(backupDir, fileName), sql, 'utf8');

    res.json({ success: true, message: '导出成功', data: { fileName, size: sql.length } });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// POST /api/database/import - 导入数据库
router.post('/database/import', async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, error: '请指定导入文件名' });
    }

    const filePath = path.join(__dirname, '..', 'backups', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: '文件不存在' });
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));

    let importedCount = 0;
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (trimmed.toUpperCase().startsWith('INSERT')) {
        await pool.query(trimmed);
        importedCount++;
      } else {
        await pool.query(trimmed);
      }
    }

    res.json({ success: true, message: `导入成功，共 ${importedCount} 条记录`, data: { importedCount } });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// GET /api/database/status - 获取数据库连接状态
router.get('/database/status', async (req, res) => {
  try {
    const startTime = Date.now();
    await pool.query('SELECT 1');
    const latency = Date.now() - startTime;

    const now = await pool.query('SELECT NOW() as server_time');
    
    res.json({ 
      success: true, 
      data: { 
        connected: true, 
        latency,
        serverTime: now.rows[0].server_time,
        poolSize: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      } 
    });
  } catch (error) {
    res.json({ 
      success: true, 
      data: { 
        connected: false, 
        error: error.message 
      } 
    });
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
        if (row.date && typeof row.date === 'string' && row.date.includes('T')) {
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
    res.status(500).json(safeError(error));
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
    if (table === 'daily_work_data' && data.date && typeof data.date === 'string' && data.date.includes('T')) {
      const dateObj = new Date(data.date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      data.date = `${year}-${month}-${day}`;
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json(safeError(error));
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
    res.status(500).json(safeError(error));
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
    res.status(500).json(safeError(error));
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
    res.status(500).json(safeError(error));
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
    res.status(500).json(safeError(error));
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
    res.status(500).json(safeError(error));
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
    res.status(500).json(safeError(error));
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
    res.status(500).json(safeError(error));
  }
});

module.exports = router;
