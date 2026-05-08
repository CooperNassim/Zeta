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

// 数据源配置路由

// GET /api/data-sources - 获取数据源列表
router.get('/data-sources', async (req, res) => {
  try {
    const { market, status } = req.query;
    let query = 'SELECT * FROM data_sources WHERE deleted = false';
    const params = [];
    let paramIndex = 1;

    if (market) {
      query += ` AND market = $${paramIndex}`;
      params.push(market);
      paramIndex++;
    }
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY CASE WHEN is_default = true THEN 0 ELSE 1 END, created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// GET /api/data-sources/:id - 获取单个数据源
router.get('/data-sources/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM data_sources WHERE id = $1 AND deleted = false',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: '数据源不存在' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// POST /api/data-sources - 创建数据源
router.post('/data-sources', async (req, res) => {
  try {
    const { name, market, provider, apiUrl, apiKey, apiSecret, rateLimit, maxRetries, timeout, isDefault, status, notes } = req.body;

    // 如果设为默认，先取消同市场的其他默认数据源
    if (isDefault) {
      await pool.query(
        'UPDATE data_sources SET is_default = false WHERE market = $1 AND deleted = false',
        [market]
      );
    }

    const result = await pool.query(
      `INSERT INTO data_sources (name, market, provider, api_url, api_key, api_secret, rate_limit, max_retries, timeout, is_default, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [name, market, provider, apiUrl, apiKey, apiSecret, rateLimit || 60, maxRetries || 3, timeout || 10, isDefault || false, status || 'enabled', notes]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// PUT /api/data-sources/:id - 更新数据源
router.put('/data-sources/:id', async (req, res) => {
  try {
    const { name, market, provider, apiUrl, apiKey, apiSecret, rateLimit, maxRetries, timeout, isDefault, status, notes } = req.body;

    // 获取当前数据源信息
    const currentResult = await pool.query(
      'SELECT market FROM data_sources WHERE id = $1 AND deleted = false',
      [req.params.id]
    );
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: '数据源不存在' });
    }

    const targetMarket = market || currentResult.rows[0].market;

    // 如果设为默认，先取消同市场的其他默认数据源
    if (isDefault) {
      await pool.query(
        'UPDATE data_sources SET is_default = false WHERE market = $1 AND id != $2 AND deleted = false',
        [targetMarket, req.params.id]
      );
    }

    const result = await pool.query(
      `UPDATE data_sources SET
         name = COALESCE($2, name),
         market = COALESCE($3, market),
         provider = COALESCE($4, provider),
         api_url = COALESCE($5, api_url),
         api_key = COALESCE($6, api_key),
         api_secret = COALESCE($7, api_secret),
         rate_limit = COALESCE($8, rate_limit),
         max_retries = COALESCE($9, max_retries),
         timeout = COALESCE($10, timeout),
         is_default = COALESCE($11, is_default),
         status = COALESCE($12, status),
         notes = COALESCE($13, notes),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted = false
       RETURNING *`,
      [req.params.id, name, market, provider, apiUrl, apiKey, apiSecret, rateLimit, maxRetries, timeout, isDefault, status, notes]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// DELETE /api/data-sources/:id - 删除数据源（软删除）
router.delete('/data-sources/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE data_sources SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: '数据源不存在' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// POST /api/data-sources/:id/test - 测试数据源连接
router.post('/data-sources/:id/test', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM data_sources WHERE id = $1 AND deleted = false',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: '数据源不存在' });
    }

    const source = result.rows[0];
    const startTime = Date.now();

    // 根据提供商类型执行不同的连接测试
    let testSuccess = false;
    let latency = 0;
    let errorMsg = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), (source.timeout || 10) * 1000);

      let testUrl = source.api_url;
      if (!testUrl) {
        // 如果没有配置 API URL，使用默认测试 URL
        switch (source.provider) {
          case 'tushare':
            testUrl = 'https://api.tushare.pro';
            break;
          case 'alphavantage':
            testUrl = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM&apikey=demo';
            break;
          case 'polygon':
            testUrl = 'https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2023-01-01/2023-01-02';
            break;
          case 'yahoo':
            testUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/AAPL';
            break;
          default:
            testUrl = source.api_url || 'https://httpbin.org/get';
        }
      }

      const response = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: source.apiKey ? { 'Authorization': `Bearer ${source.apiKey}` } : {}
      });

      clearTimeout(timeoutId);
      latency = Date.now() - startTime;

      if (response.ok || response.status === 400 || response.status === 401) {
        testSuccess = true;
      } else {
        errorMsg = `HTTP ${response.status}`;
      }
    } catch (e) {
      latency = Date.now() - startTime;
      if (e.name === 'AbortError') {
        errorMsg = '连接超时';
      } else {
        errorMsg = e.message;
      }
    }

    // 更新测试结果
    await pool.query(
      'UPDATE data_sources SET last_tested_at = CURRENT_TIMESTAMP, last_test_status = $1, last_test_latency = $2 WHERE id = $3',
      [testSuccess ? 'success' : 'error', latency, req.params.id]
    );

    if (testSuccess) {
      res.json({ success: true, data: { latency, status: 'success' } });
    } else {
      res.json({ success: false, error: errorMsg || '连接失败', data: { latency, status: 'error' } });
    }
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// 数据同步历史路由

// GET /api/sync-history - 获取同步历史列表
router.get('/sync-history', async (req, res) => {
  try {
    const { market, status, page = 1, pageSize = 20 } = req.query;
    let query = `SELECT sh.*, ds.name as data_source_name, ds.provider, ds.market as source_market
                 FROM data_sync_history sh
                 LEFT JOIN data_sources ds ON sh.data_source_id = ds.id
                 WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (market) {
      query += ` AND sh.market = $${paramIndex}`;
      params.push(market);
      paramIndex++;
    }
    if (status) {
      query += ` AND sh.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY sh.started_at DESC';

    // 获取总数
    const countResult = await pool.query(query, params);
    const totalCount = countResult.rows.length;

    // 分页查询
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

    const result = await pool.query(query, params);
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(totalCount / parseInt(pageSize))
      }
    });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// GET /api/sync-history/:id - 获取单条同步历史详情
router.get('/sync-history/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sh.*, ds.name as data_source_name, ds.provider, ds.market as source_market
       FROM data_sync_history sh
       LEFT JOIN data_sources ds ON sh.data_source_id = ds.id
       WHERE sh.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: '同步历史不存在' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// POST /api/sync/execute - 执行数据同步
router.post('/sync/execute', async (req, res) => {
  try {
    const { market, data_source_id, sync_type = 'full', stock_codes = [] } = req.body;

    if (!market || !data_source_id) {
      return res.status(400).json({ success: false, error: '缺少必要参数：market 或 data_source_id' });
    }

    // 获取数据源信息
    const sourceResult = await pool.query(
      'SELECT * FROM data_sources WHERE id = $1 AND deleted = false AND status = \'enabled\'',
      [data_source_id]
    );
    if (sourceResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: '数据源不存在或已停用' });
    }

    const source = sourceResult.rows[0];

    // 创建同步历史记录
    const historyResult = await pool.query(
      `INSERT INTO data_sync_history (market, data_source_id, sync_type, status)
       VALUES ($1, $2, $3, 'running')
       RETURNING *`,
      [market, data_source_id, sync_type]
    );
    const historyId = historyResult.rows[0].id;

    // 异步执行同步操作
    (async () => {
      let totalCount = 0;
      let newCount = 0;
      let updatedCount = 0;
      let failedCount = 0;
      let errorMessage = null;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), (source.timeout || 30) * 1000);

        // 根据提供商类型调用不同的API
        const apiUrl = buildSyncApiUrl(source.provider, source, stock_codes);

        if (!apiUrl) {
          throw new Error(`暂不支持数据提供商：${source.provider}`);
        }

        const response = await fetch(apiUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: source.apiKey ? { 'Authorization': `Bearer ${source.apiKey}` } : {}
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API请求失败：HTTP ${response.status}`);
        }

        const apiData = await response.json();
        const stocks = parseStockData(source.provider, apiData);

        // 同步股票数据到 stock_pool
        for (const stock of stocks) {
          try {
            const existingResult = await pool.query(
              'SELECT id FROM stock_pool WHERE symbol = $1 AND deleted = false',
              [stock.symbol]
            );

            totalCount++;

            if (existingResult.rows.length > 0) {
              // 更新已有股票
              await pool.query(
                `UPDATE stock_pool SET
                   current_price = $1,
                   change_percent = $2,
                   volume = $3,
                   updated_at = CURRENT_TIMESTAMP
                 WHERE symbol = $4 AND deleted = false`,
                [stock.currentPrice || null, stock.changePercent || null, stock.volume || null, stock.symbol]
              );
              updatedCount++;
            } else {
              // 新增股票
              await pool.query(
                `INSERT INTO stock_pool (symbol, name, market_type, current_price, change_percent, volume, status)
                 VALUES ($1, $2, $3, $4, $5, $6, '正常')`,
                [stock.symbol, stock.name || '', market, stock.currentPrice || null, stock.changePercent || null, stock.volume || null]
              );
              newCount++;
            }
          } catch (err) {
            failedCount++;
            console.error(`同步股票 ${stock.symbol} 失败:`, err.message);
          }
        }

        // 更新同步历史为成功
        await pool.query(
          `UPDATE data_sync_history SET
             total_count = $1, new_count = $2, updated_count = $3, failed_count = $4,
             status = 'success', completed_at = CURRENT_TIMESTAMP
           WHERE id = $5`,
          [totalCount, newCount, updatedCount, failedCount, historyId]
        );
      } catch (err) {
        errorMessage = err.message;
        await pool.query(
          `UPDATE data_sync_history SET
             total_count = $1, new_count = $2, updated_count = $3, failed_count = $4,
             status = 'failed', error_message = $5, completed_at = CURRENT_TIMESTAMP
           WHERE id = $6`,
          [totalCount, newCount, updatedCount, failedCount, errorMessage, historyId]
        );
      }
    })();

    res.json({
      success: true,
      data: {
        history_id: historyId,
        message: '同步任务已启动，请等待执行完成'
      }
    });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// 构建同步API URL
function buildSyncApiUrl(provider, source, stockCodes) {
  switch (provider) {
    case 'tushare':
      return 'https://api.tushare.pro';
    case 'akshare':
      return null; // AKShare 需要后端专用客户端
    case 'eastmoney':
      return null; // 东方财富需要特殊处理
    case 'alphavantage':
      return 'https://www.alphavantage.co/query?function=BATCH_STOCK_QUOTES&symbols=AAPL,MSFT,GOOGL&apikey=demo';
    case 'yahoo':
      return 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=AAPL,MSFT,GOOGL';
    case 'polygon':
      return 'https://api.polygon.io/v2/snapshot/locale/us/markets/stocks';
    default:
      if (source.api_url) return source.api_url;
      return null;
  }
}

// 解析股票数据
function parseStockData(provider, apiData) {
  const stocks = [];

  switch (provider) {
    case 'tushare':
      if (apiData.code === 0 && apiData.data && apiData.data.items) {
        apiData.data.items.forEach(item => {
          stocks.push({
            symbol: item[0],
            name: item[1],
            currentPrice: parseFloat(item[3]),
            changePercent: parseFloat(item[5]),
            volume: parseFloat(item[9])
          });
        });
      }
      break;
    case 'alphavantage':
      if (apiData['Stock Quotes'] && Array.isArray(apiData['Stock Quotes'])) {
        apiData['Stock Quotes'].forEach(item => {
          stocks.push({
            symbol: item['1. symbol'],
            currentPrice: parseFloat(item['2. price']),
            changePercent: 0,
            volume: parseFloat(item['3. volume']) || 0
          });
        });
      }
      break;
    case 'yahoo':
      if (apiData.quoteResponse && Array.isArray(apiData.quoteResponse.result)) {
        apiData.quoteResponse.result.forEach(item => {
          stocks.push({
            symbol: item.symbol,
            name: item.shortName || item.longName || '',
            currentPrice: item.regularMarketPrice || null,
            changePercent: item.regularMarketChangePercent || 0,
            volume: item.regularMarketVolume || 0
          });
        });
      }
      break;
    case 'polygon':
      if (apiData.tickers && Array.isArray(apiData.tickers)) {
        apiData.tickers.forEach(item => {
          stocks.push({
            symbol: item.ticker,
            currentPrice: item.day?.close || null,
            changePercent: item.day?.changePercent || 0,
            volume: item.day?.volume || 0
          });
        });
      }
      break;
    default:
      if (Array.isArray(apiData)) {
        stocks.push(...apiData);
      }
  }

  return stocks;
}

// 大模型配置路由

// GET /api/llm-configs - 获取大模型列表
router.get('/llm-configs', async (req, res) => {
  try {
    const { category, status } = req.query;
    let query = 'SELECT * FROM llm_configs WHERE deleted = false';
    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY CASE WHEN is_default = true THEN 0 ELSE 1 END, created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// GET /api/llm-configs/:id - 获取单个大模型
router.get('/llm-configs/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM llm_configs WHERE id = $1 AND deleted = false',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: '大模型配置不存在' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// POST /api/llm-configs - 创建大模型
router.post('/llm-configs', async (req, res) => {
  try {
    const { name, category, provider, modelId, apiUrl, apiKey, maxTokens, temperature, topP, frequencyPenalty, presencePenalty, isDefault, status, notes } = req.body;

    // 如果设为默认，先取消其他默认大模型
    if (isDefault) {
      await pool.query(
        'UPDATE llm_configs SET is_default = false WHERE deleted = false'
      );
    }

    const result = await pool.query(
      `INSERT INTO llm_configs (name, category, provider, model_id, api_url, api_key, max_tokens, temperature, top_p, frequency_penalty, presence_penalty, is_default, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [name, category, provider, modelId, apiUrl, apiKey, maxTokens || 4096, temperature || 0.7, topP || 1.0, frequencyPenalty || 0, presencePenalty || 0, isDefault || false, status || 'enabled', notes]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// PUT /api/llm-configs/:id - 更新大模型
router.put('/llm-configs/:id', async (req, res) => {
  try {
    const { name, category, provider, modelId, apiUrl, apiKey, maxTokens, temperature, topP, frequencyPenalty, presencePenalty, isDefault, status, notes } = req.body;

    // 获取当前模型信息
    const currentResult = await pool.query(
      'SELECT * FROM llm_configs WHERE id = $1 AND deleted = false',
      [req.params.id]
    );
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: '大模型配置不存在' });
    }

    // 如果设为默认，先取消其他默认大模型
    if (isDefault) {
      await pool.query(
        'UPDATE llm_configs SET is_default = false WHERE id != $1 AND deleted = false',
        [req.params.id]
      );
    }

    const result = await pool.query(
      `UPDATE llm_configs SET
         name = COALESCE($2, name),
         category = COALESCE($3, category),
         provider = COALESCE($4, provider),
         model_id = COALESCE($5, model_id),
         api_url = COALESCE($6, api_url),
         api_key = COALESCE($7, api_key),
         max_tokens = COALESCE($8, max_tokens),
         temperature = COALESCE($9, temperature),
         top_p = COALESCE($10, top_p),
         frequency_penalty = COALESCE($11, frequency_penalty),
         presence_penalty = COALESCE($12, presence_penalty),
         is_default = COALESCE($13, is_default),
         status = COALESCE($14, status),
         notes = COALESCE($15, notes),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted = false
       RETURNING *`,
      [req.params.id, name, category, provider, modelId, apiUrl, apiKey, maxTokens, temperature, topP, frequencyPenalty, presencePenalty, isDefault, status, notes]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// DELETE /api/llm-configs/:id - 删除大模型（软删除）
router.delete('/llm-configs/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE llm_configs SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: '大模型配置不存在' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// POST /api/llm-configs/:id/test - 测试大模型连接
router.post('/llm-configs/:id/test', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM llm_configs WHERE id = $1 AND deleted = false',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: '大模型配置不存在' });
    }

    const config = result.rows[0];
    const startTime = Date.now();

    let testSuccess = false;
    let latency = 0;
    let errorMsg = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

      // 构建测试 URL
      let testUrl = config.api_url;
      // 根据不同提供商构建正确的测试 URL
      if (config.provider && config.provider.includes('gpt') || config.category === 'OpenAI') {
        testUrl = `${config.api_url}/chat/completions`;
      } else if (config.category === 'Anthropic') {
        testUrl = `${config.api_url}/v1/messages`;
      }

      const headers = {
        'Content-Type': 'application/json'
      };
      // 根据提供商设置认证头
      if (config.category === 'Anthropic') {
        headers['x-api-key'] = config.api_key;
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = `Bearer ${config.api_key}`;
      }

      const body = {
        model: config.model_id,
        max_tokens: Math.min(config.max_tokens || 4096, 100),
        messages: [{ role: 'user', content: 'Hello' }]
      };

      const response = await fetch(testUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      latency = Date.now() - startTime;

      // 200 或 400 都表示连接成功（400 可能是因为参数问题但至少连接上了）
      if (response.ok || response.status === 400) {
        testSuccess = true;
      } else {
        errorMsg = `HTTP ${response.status}`;
      }
    } catch (e) {
      latency = Date.now() - startTime;
      if (e.name === 'AbortError') {
        errorMsg = '连接超时';
      } else {
        errorMsg = e.message;
      }
    }

    // 更新测试结果
    await pool.query(
      'UPDATE llm_configs SET last_tested_at = CURRENT_TIMESTAMP, last_test_status = $1, last_test_latency = $2 WHERE id = $3',
      [testSuccess ? 'success' : 'error', latency, req.params.id]
    );

    if (testSuccess) {
      res.json({ success: true, data: { latency, status: 'success' } });
    } else {
      res.json({ success: false, error: errorMsg || '连接失败', data: { latency, status: 'error' } });
    }
  } catch (error) {
    res.status(500).json(safeError(error));
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
