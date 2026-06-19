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
const {
  getProvider,
  fetchTushareKline,
  fetchAKShareKline,
  fetchSinaKline,
  fetchEastmoneyKline,
  fetchYahooKline,
  fetchPolygonKline,
  fetchLongportKline,
} = require('./marketData');
const { authenticateToken, requireRole } = require('../middleware/auth');

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

// GET /api/sync/all - 同步数据（从数据库获取所有数据）
router.get('/sync/all', authenticateToken, async (req, res) => {
  try {
    const tables = [
      'account',
      'daily_work_data',
      'psychological_indicators',
      'psychological_test_results',
      'trading_strategies',
      'risk_config',
      'orders',
      'transactions',
      'trade_records',
      'trade_orders',
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
router.get('/psychological_test_results/by-date/:date', authenticateToken, async (req, res) => {
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

router.post('/psychological_test_results', authenticateToken, async (req, res) => {
  try {
    const { test_date, scores, overall_score } = req.body;

    const result = await pool.query(
      `INSERT INTO psychological_test_results (test_date, indicators, total_score, user_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (test_date) DO UPDATE
       SET indicators = EXCLUDED.indicators, total_score = EXCLUDED.total_score, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [test_date, JSON.stringify(scores), parseFloat(overall_score), req.user.id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[POST /psychological_test_results] Error:', error);
    res.status(500).json(safeError(error));
  }
});

router.put('/psychological_test_results/by-date/:date', authenticateToken, async (req, res) => {
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
router.post('/:table/bulk/delete', authenticateToken, async (req, res) => {
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
router.post('/:table/bulk', authenticateToken, async (req, res, next) => {
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
router.get('/database/info', authenticateToken, requireRole('admin'), async (req, res) => {
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
      SELECT EXTRACT(EPOCH FROM (current_timestamp - pg_postmaster_start_time())) as uptime_seconds
    `);
    const uptimeSeconds = parseInt(uptime.rows[0].uptime_seconds);
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    dbInfo.uptime = `${hours}时${minutes}分${seconds}秒`;

    res.json({ success: true, data: dbInfo });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// POST /api/database/restart - 重启数据库连接池
router.post('/database/restart', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // 记录重启前状态
    const beforeStatus = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };

    // 释放所有空闲连接
    pool.releaseAll?.() || pool._removeIdleClients?.();

    // 测试数据库连接是否正常
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    // 记录重启后状态和时间
    const afterStatus = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };

    res.json({
      success: true,
      message: '数据库连接池已重启',
      data: {
        restartTime: new Date().toISOString(),
        before: beforeStatus,
        after: afterStatus
      }
    });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// GET /api/database/backups - 获取备份列表
router.get('/database/backups', authenticateToken, requireRole('admin'), async (req, res) => {
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
router.post('/database/backup', authenticateToken, requireRole('admin'), async (req, res) => {
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
router.delete('/database/backup/:filename', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { filename } = req.params;

    // 验证文件名不包含路径分隔符
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return res.status(403).json({ success: false, error: '非法文件名' });
    }

    const backupDir = path.resolve(path.join(__dirname, '..', 'backups'));
    const filePath = path.resolve(path.join(backupDir, filename));

    // 验证解析后的路径是否以 backupDir 开头，防止路径遍历
    if (!filePath.startsWith(backupDir + path.sep) && filePath !== backupDir) {
      return res.status(403).json({ success: false, error: '非法文件路径' });
    }

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
router.post('/database/restore', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, error: '请指定备份文件名' });
    }

    // 路径遍历验证
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return res.status(403).json({ success: false, error: '非法文件名' });
    }

    const backupDir = path.resolve(path.join(__dirname, '..', 'backups'));
    const filePath = path.resolve(path.join(backupDir, filename));

    if (!filePath.startsWith(backupDir + path.sep) && filePath !== backupDir) {
      return res.status(403).json({ success: false, error: '非法文件路径' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: '备份文件不存在' });
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));

    // 验证语句类型，只允许 INSERT 和 UPDATE
    const ALLOWED_STATEMENT_PREFIXES = ['INSERT', 'UPDATE'];
    const DANGEROUS_PREFIXES = ['DROP', 'DELETE', 'ALTER', 'CREATE', 'TRUNCATE'];

    for (const stmt of statements) {
      const trimmed = stmt.trim().toUpperCase();
      const firstWord = trimmed.split(/\s+/)[0];

      if (DANGEROUS_PREFIXES.includes(firstWord)) {
        return res.status(403).json({ success: false, error: `不允许执行危险语句: ${firstWord}` });
      }

      if (!ALLOWED_STATEMENT_PREFIXES.includes(firstWord)) {
        return res.status(403).json({ success: false, error: `不允许执行的语句类型: ${firstWord}` });
      }
    }

    // 使用事务包裹整个恢复过程
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const stmt of statements) {
        await client.query(stmt.trim());
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ success: true, message: '数据恢复成功' });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// POST /api/database/cleanup - 清理数据库
router.post('/database/cleanup', authenticateToken, requireRole('admin'), async (req, res) => {
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
router.post('/database/export', authenticateToken, requireRole('admin'), async (req, res) => {
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
router.post('/database/import', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, error: '请指定导入文件名' });
    }

    // 路径遍历验证
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return res.status(403).json({ success: false, error: '非法文件名' });
    }

    const backupDir = path.resolve(path.join(__dirname, '..', 'backups'));
    const filePath = path.resolve(path.join(backupDir, filename));

    if (!filePath.startsWith(backupDir + path.sep) && filePath !== backupDir) {
      return res.status(403).json({ success: false, error: '非法文件路径' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: '文件不存在' });
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));

    // 验证语句类型，只允许 INSERT 和 UPDATE
    const ALLOWED_STATEMENT_PREFIXES = ['INSERT', 'UPDATE'];
    const DANGEROUS_PREFIXES = ['DROP', 'DELETE', 'ALTER', 'CREATE', 'TRUNCATE'];

    for (const stmt of statements) {
      const trimmed = stmt.trim().toUpperCase();
      const firstWord = trimmed.split(/\s+/)[0];

      if (DANGEROUS_PREFIXES.includes(firstWord)) {
        return res.status(403).json({ success: false, error: `不允许执行危险语句: ${firstWord}` });
      }

      if (!ALLOWED_STATEMENT_PREFIXES.includes(firstWord)) {
        return res.status(403).json({ success: false, error: `不允许执行的语句类型: ${firstWord}` });
      }
    }

    // 使用事务包裹整个导入过程
    let importedCount = 0;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const stmt of statements) {
        const trimmed = stmt.trim();
        await client.query(trimmed);
        if (trimmed.toUpperCase().startsWith('INSERT')) {
          importedCount++;
        }
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ success: true, message: `导入成功，共 ${importedCount} 条记录`, data: { importedCount } });
  } catch (error) {
    res.status(500).json(safeError(error));
  }
});

// GET /api/database/status - 获取数据库连接状态
router.get('/database/status', authenticateToken, requireRole('admin'), async (req, res) => {
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

// ===================== 市场行情数据路由 =====================

// GET /api/market/stocks?provider=tushare - 获取股票行情列表
router.get('/market/stocks', authenticateToken, async (req, res) => {
  try {
    const { provider } = req.query;
    const p = getProvider(provider);
    if (!p) {
      return res.status(400).json({ success: false, error: `不支持的数据提供商: ${provider}` });
    }

    let stocks;
    switch (provider) {
      case 'tushare':
        stocks = await fetchTushareStocks();
        break;
      case 'akshare':
        stocks = await fetchAKShareStocks();
        break;
      case 'sina':
        stocks = await fetchSinaStocks();
        break;
      case 'eastmoney':
        stocks = await fetchEastmoneyStocks();
        break;
      case 'yahoo':
        stocks = await fetchYahooStocks();
        break;
      case 'polygon':
        stocks = await fetchPolygonStocks(req.query.apiKey || '');
        break;
      case 'longport':
        stocks = await fetchLongportStocks();
        break;
      default:
        return res.status(400).json({ success: false, error: '不支持的提供商' });
    }

    res.json({ success: true, data: stocks, count: stocks.length });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/market/kline?provider=eastmoney&symbol=000001&period=D&limit=120 - 获取K线数据
router.get('/market/kline', authenticateToken, async (req, res) => {
  try {
    const { provider, symbol, period = 'D', limit } = req.query;
    if (!symbol) {
      return res.status(400).json({ success: false, error: '缺少 symbol 参数' });
    }

    // 优先从本地数据库读取K线数据（stock_daily/stock_weekly/stock_monthly）
    try {
      const tableName = period === 'D' ? 'stock_daily' : period === 'W' ? 'stock_weekly' : period === 'M' ? 'stock_monthly' : 'stock_daily';
      const dateField = period === 'D' ? 'trade_date' : period === 'W' ? 'week_date' : period === 'M' ? 'month_date' : 'trade_date';

      // 如果传了 limit 参数则限制条数，否则返回数据库中该股票的全部数据
      let dbResult;
      if (limit) {
        dbResult = await pool.query(
          `SELECT ${dateField} as date, open_price as open, high_price as high, low_price as low, close_price as close, volume, amount
           FROM ${tableName}
           WHERE symbol = $1
           ORDER BY ${dateField} DESC
           LIMIT $2`,
          [symbol, parseInt(limit)]
        );
      } else {
        // 不限制条数，返回数据库中全部历史数据
        dbResult = await pool.query(
          `SELECT ${dateField} as date, open_price as open, high_price as high, low_price as low, close_price as close, volume, amount
           FROM ${tableName}
           WHERE symbol = $1
           ORDER BY ${dateField} DESC`,
          [symbol]
        );
      }

      if (dbResult.rows.length > 0) {
        const klines = dbResult.rows.reverse().map(row => {
          // 处理日期格式：YYYYMMDD -> timestamp
          let dateStr = row.date;
          if (dateStr.length === 8 && !dateStr.includes('-')) {
            dateStr = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
          }
          const timestamp = new Date(dateStr).getTime();
          return {
            timestamp,
            date: dateStr,
            open: parseFloat(row.open),
            high: parseFloat(row.high),
            low: parseFloat(row.low),
            close: parseFloat(row.close),
            volume: parseFloat(row.volume || 0),
            amount: parseFloat(row.amount || 0),
          };
        });

        // 按日期去重（保留最新一条，防止数据库中同一日期有多条记录）
        const dateMap = new Map();
        klines.forEach(k => {
          const key = k.date;
          if (!dateMap.has(key) || k.timestamp > dateMap.get(key).timestamp) {
            dateMap.set(key, k);
          }
        });
        const dedupedKlines = Array.from(dateMap.values()).sort((a, b) => a.timestamp - b.timestamp);

        return res.json({ success: true, data: dedupedKlines, count: dedupedKlines.length, source: 'database' });
      }
    } catch (dbErr) {
      console.warn(`[MarketKline] 数据库查询失败，尝试外部API: ${dbErr.message}`);
    }

    // 数据库无数据，回退到外部API
    const p = getProvider(provider);
    if (!p) {
      return res.status(400).json({ success: false, error: `不支持的数据提供商: ${provider}` });
    }

    let klines;
    switch (provider) {
      case 'tushare':
        klines = await fetchTushareKline(symbol, period, limit);
        break;
      case 'akshare':
        klines = await fetchAKShareKline(symbol, period, limit);
        break;
      case 'sina':
        klines = await fetchSinaKline(symbol, period, limit);
        break;
      case 'eastmoney':
        klines = await fetchEastmoneyKline(symbol, period, limit);
        break;
      case 'yahoo':
        klines = await fetchYahooKline(symbol, period, limit);
        break;
      case 'polygon':
        klines = await fetchPolygonKline(symbol, req.query.apiKey || '', period, limit);
        break;
      case 'longport':
        klines = await fetchLongportKline(symbol);
        break;
      default:
        return res.status(400).json({ success: false, error: '不支持的提供商' });
    }

    res.json({ success: true, data: klines, count: klines.length, source: 'api' });
  } catch (e) {
    console.error('[MarketKline] 获取K线失败:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ===================== 历史行情数据路由 =====================

// ========================================
// 通用CRUD路由
// ========================================

// GET /api/:table - 获取列表
router.get('/:table', authenticateToken, async (req, res) => {
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
router.get('/:table/:id', authenticateToken, async (req, res) => {
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
router.post('/:table', authenticateToken, async (req, res) => {
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
router.put('/:table/:id', authenticateToken, async (req, res) => {
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
router.delete('/:table/:id', authenticateToken, async (req, res, next) => {
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
router.patch('/:table/:id/restore', authenticateToken, async (req, res) => {
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
router.patch('/:table/bulk/restore', authenticateToken, async (req, res) => {
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
router.delete('/:table/:id/permanent', authenticateToken, requireRole('admin'), async (req, res) => {
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
router.delete('/:table/bulk/permanent', authenticateToken, requireRole('admin'), async (req, res) => {
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
