const express = require('express');
const cors = require('cors');
const { findAll } = require('./src/models/db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 测试同步接口
app.get('/test-sync', async (req, res) => {
  try {
    console.log('[Test] 开始测试同步接口');
    
    const tables = [
      'account',
      'daily_work_data',
      'psychological_indicators',
      'psychological_test_results',
      'trading_strategies',
      'risk_config',
      'technical_indicators',
      'trade_orders',
      'transactions',
      'trade_records',
      'stock_pool',
      'stock_kline_data',
      'strategy_records'
    ];

    const syncData = {};

    for (const table of tables) {
      console.log(`[Test] 处理表: ${table}`);
      try {
        const data = await findAll(table);
        console.log(`[Test] 表 ${table} 查询成功，记录数: ${data.length}`);
        
        // 特殊处理日期格式，转换为 YYYY-MM-DD 字符串
        if (table === 'psychological_test_results') {
          syncData[table] = data.map(item => {
            console.log(`[Test] 处理心理测试结果: test_date = ${item.test_date}`);
            return {
              ...item,
              test_date: item.test_date ? (() => {
                const dateObj = new Date(item.test_date);
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              })() : null
            };
          });
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
        console.error(`[Test] 表 ${table} 出错:`, err.message, err.stack);
        syncData[table] = [];
      }
    }

    console.log('[Test] 同步完成');
    res.json({
      success: true,
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: syncData
    });
  } catch (error) {
    console.error('[Test] 同步错误:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[Test] 测试服务器运行在端口 ${PORT}`);
  console.log(`[Test] 访问 http://localhost:${PORT}/test-sync 测试同步接口`);
});
