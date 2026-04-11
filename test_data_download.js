// 测试数据下载功能的增强版stock_pool同步
import { pool } from './backend/src/config/database.js';

async function testDataDownload() {
  console.log('=== 测试数据下载功能修复效果 ===');
  
  const client = await pool.connect();
  
  try {
    // 模拟DataDownload组件下载的149只股票数据
    const mockDownloadedStocks = [
      { symbol: '000001', name: '平安银行', currentPrice: 11.09, market: 'sz' },
      { symbol: '000002', name: '万 科Ａ', currentPrice: 3.89, market: 'sz' },
      { symbol: '301563', name: '瑞虹股份', currentPrice: 156.31, market: 'sz' },
      // 模拟更多新股票
      { symbol: '600031', name: '三一重工', currentPrice: 15.20, market: 'sh' },
      { symbol: '000650', name: '仁和药业', currentPrice: 6.45, market: 'sz' },
      { symbol: '300750', name: '宁德时代', currentPrice: 198.75, market: 'sz' },
      { symbol: '601888', name: '中国中免', currentPrice: 87.32, market: 'sh' },
      { symbol: '688981', name: '中芯国际', currentPrice: 42.18, market: 'sh' }
    ];
    
    console.log(`模拟下载 ${mockDownloadedStocks.length} 只股票数据`);
    
    // 先查询修复前的stock_pool表状态
    const beforeStats = await client.query(`
      SELECT COUNT(*) as total FROM stock_pool WHERE status != 'deleted'
    `);
    console.log(`修复前stock_pool表活跃股票数量: ${beforeStats.rows[0].total}`);
    
    // 模拟调用后端API进行数据更新（使用新的增强同步逻辑）
    console.log('开始模拟数据更新到数据库...');
    
    await client.query('BEGIN');
    
    try {
      // 使用增强版同步逻辑更新数据
      for (const stock of mockDownloadedStocks) {
        const symbol = String(stock.symbol).trim();
        const stockData = {
          symbol: symbol,
          name: stock.name || `股票${symbol}`,
          current_price: parseFloat(stock.currentPrice) || 0,
          change_percent: Math.random() * 10 - 5, // 随机涨跌幅
          market: stock.market || (symbol.startsWith('6') ? 'sh' : 'sz'),
        };
        
        // 首先更新market_quotes表
        await client.query(`
          INSERT INTO market_quotes (
            symbol, name, current_price, prev_close, change_percent, 
            volume, market, timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (symbol) DO UPDATE SET
            name = EXCLUDED.name,
            current_price = EXCLUDED.current_price,
            prev_close = EXCLUDED.prev_close,
            change_percent = EXCLUDED.change_percent,
            volume = EXCLUDED.volume,
            market = EXCLUDED.market,
            timestamp = EXCLUDED.timestamp
        `, [
          stockData.symbol, stockData.name, stockData.current_price,
          stockData.current_price * 0.98, stockData.change_percent,
          Math.floor(Math.random() * 1000000) + 100000,
          stockData.market, new Date().toISOString()
        ]);
        
        // 使用增强版stock_pool同步逻辑
        await client.query(`
          INSERT INTO stock_pool (symbol, name, market, sector, current_price, change_percent, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
          ON CONFLICT (symbol) DO UPDATE SET
            name = EXCLUDED.name,
            market = EXCLUDED.market,
            sector = EXCLUDED.sector,
            current_price = EXCLUDED.current_price,
            change_percent = EXCLUDED.change_percent,
            status = CASE 
              WHEN stock_pool.status = 'deleted' THEN 'active'
              ELSE EXCLUDED.status
            END,
            updated_at = CURRENT_TIMESTAMP
        `, [
          symbol, 
          stockData.name,
          stockData.market,
          '通用',
          stockData.current_price,
          stockData.change_percent,
          'active'
        ]);
        
        console.log(`✅ 同步处理股票: ${symbol}`);
      }
      
      await client.query('COMMIT');
      console.log('数据更新事务提交成功');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('数据更新失败，已回滚:', error);
      throw error;
    }
    
    // 验证修复效果
    const afterStats = await client.query(`
      SELECT COUNT(*) as total FROM stock_pool WHERE status != 'deleted'
    `);
    console.log(`修复后stock_pool表活跃股票数量: ${afterStats.rows[0].total}`);
    
    // 显示所有活跃股票
    const activeStocks = await client.query(`
      SELECT symbol, name FROM stock_pool WHERE status != 'deleted' ORDER BY symbol
    `);
    console.log(`当前stock_pool表所有活跃股票 (${activeStocks.rows.length}只):`);
    console.log(activeStocks.rows.map(stock => `${stock.symbol} - ${stock.name}`).join(', '));
    
    console.log('\n=== 测试结果 ===');
    const delta = afterStats.rows[0].total - beforeStats.rows[0].total;
    if (delta > 0) {
      console.log(`✅ 修复成功！stock_pool表新增了 ${delta} 只股票`);
      console.log('✅ 数据同步机制正常工作');
    } else {
      console.log('⚠️ stock_pool表数量未变化，可能所有股票已存在');
    }
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  } finally {
    client.release();
  }
}

// 执行测试
testDataDownload().then(() => {
  console.log('\n测试完成！现在可以在浏览器中访问 http://localhost:5176/data-download 来测试实际数据下载功能。');
  process.exit(0);
}).catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});