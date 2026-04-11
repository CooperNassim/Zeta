const { pool } = require('./src/config/database');

async function debugMarketQuotesController() {
  console.log('🔍 调试marketQuotesController.js的执行过程...\n');

  const client = await pool.connect();
  try {
    // 模拟API请求的数据
    const testData = {
      symbol: '301563',
      name: '测试股票301563', 
      currentPrice: 15.68,
      prevClose: 15.50,
      changePercent: 1.16,
      volume: 1589000,
      highPrice: 15.80,
      lowPrice: 15.45,
      openPrice: 15.55,
      amount: 24800000,
      market: 'sz',
      timestamp: new Date().toISOString()
    };

    console.log('1. 开始模拟controller执行...');
    
    // 数据验证和过滤
    const stocks = [testData];
    const validStocks = stocks.filter(stock => {
      if (!stock || !stock.symbol) {
        console.log('   跳过无效股票数据（缺少symbol）:', stock);
        return false;
      }
      
      // 进一步验证股票代码格式
      const symbol = String(stock.symbol).trim();
      if (!/^[0-9]{6}$/.test(symbol)) {
        console.log(`   股票代码格式错误: ${symbol}`, stock);
        return false;
      }
      
      return true;
    });

    console.log(`2. 过滤后有效股票数据: ${validStocks.length} 条`);

    if (validStocks.length === 0) {
      console.log('   没有有效的股票数据可更新');
      return;
    }

    await client.query('BEGIN');
    console.log('3. 数据库事务开始');
    
    let updatedCount = 0;
    let insertedCount = 0;
    let errorCount = 0;

    for (const stock of validStocks) {
      try {
        console.log(`\n4. 处理股票 ${stock.symbol}:`);
        
        // 增强数据处理
        const symbol = String(stock.symbol).trim();
        const stockData = {
          symbol: symbol,
          name: stock.name || `股票${symbol}`,
          current_price: parseFloat(stock.currentPrice) || parseFloat(stock.current_price) || 0,
          prev_close: parseFloat(stock.prevClose) || parseFloat(stock.prev_close) || 
                     parseFloat(stock.currentPrice) || parseFloat(stock.current_price) || 0,
          change_percent: parseFloat(stock.changePercent) || parseFloat(stock.change_percent) || 0,
          volume: parseFloat(stock.volume) || 0,
          high_price: parseFloat(stock.highPrice) || parseFloat(stock.high_price) || 
                     parseFloat(stock.currentPrice) || parseFloat(stock.current_price) || 0,
          low_price: parseFloat(stock.lowPrice) || parseFloat(stock.low_price) || 
                    parseFloat(stock.currentPrice) || parseFloat(stock.current_price) || 0,
          open_price: parseFloat(stock.openPrice) || parseFloat(stock.open_price) || 
                     parseFloat(stock.currentPrice) || parseFloat(stock.current_price) || 0,
          amount: parseFloat(stock.amount) || 0,
          market: stock.market || (symbol.startsWith('6') ? 'sh' : 'sz'),
          timestamp: new Date().toISOString()
        };

        console.log('   处理后的数据:', JSON.stringify(stockData, null, 2));

        // 使用 INSERT ... ON CONFLICT DO UPDATE 插入market_quotes表
        console.log('   插入market_quotes表...');
        const result = await client.query(`
          INSERT INTO market_quotes (
            symbol, name, current_price, prev_close, change_percent, 
            volume, high_price, low_price, open_price, amount, 
            market, timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (symbol) DO UPDATE SET
            name = EXCLUDED.name,
            current_price = EXCLUDED.current_price,
            prev_close = EXCLUDED.prev_close,
            change_percent = EXCLUDED.change_percent,
            volume = EXCLUDED.volume,
            high_price = EXCLUDED.high_price,
            low_price = EXCLUDED.low_price,
            open_price = EXCLUDED.open_price,
            amount = EXCLUDED.amount,
            market = EXCLUDED.market,
            timestamp = EXCLUDED.timestamp
          RETURNING *
        `, [
          stockData.symbol, stockData.name, stockData.current_price, stockData.prev_close,
          stockData.change_percent, stockData.volume, stockData.high_price, 
          stockData.low_price, stockData.open_price, stockData.amount,
          stockData.market, stockData.timestamp
        ]);

        if (result.rows.length > 0) {
          console.log('   ✅ market_quotes表操作成功');
          
          // 同步更新stock_pool表
          console.log('   同步更新stock_pool表...');
          await client.query(`
            INSERT INTO stock_pool (symbol, name, market, sector, current_price, change_percent, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (symbol) DO UPDATE SET
              name = EXCLUDED.name,
              market = EXCLUDED.market,
              sector = EXCLUDED.sector,
              current_price = EXCLUDED.current_price,
              change_percent = EXCLUDED.change_percent,
              status = EXCLUDED.status,
              updated_at = CURRENT_TIMESTAMP
          `, [
            stockData.symbol, 
            stockData.name,
            stockData.market,
            '通用',
            stockData.current_price,
            stockData.change_percent,
            'active'
          ]);
          
          console.log('   ✅ stock_pool表同步成功');
          insertedCount++;
        }

      } catch (stockError) {
        errorCount++;
        console.error(`❌ 处理股票 ${stock?.symbol} 时出错:`, stockError.message);
        console.error('   错误详情:', stockError);
      }
    }

    await client.query('COMMIT');
    console.log('\n5. 数据库事务提交成功');
    
    console.log(`   - 新增: ${insertedCount}`);
    console.log(`   - 更新: ${updatedCount}`);
    console.log(`   - 错误: ${errorCount}`);

    // 验证最终结果
    console.log('\n6. 验证最终结果...');
    const marketResult = await client.query('SELECT COUNT(*) FROM market_quotes');
    const poolResult = await client.query('SELECT COUNT(*) FROM stock_pool');
    console.log(`   market_quotes表记录数: ${marketResult.rows[0].count}`);
    console.log(`   stock_pool表记录数: ${poolResult.rows[0].count}`);

  } catch (transactionError) {
    await client.query('ROLLBACK');
    console.error('❌ 数据库事务失败，已回滚:', transactionError);
  } finally {
    client.release();
  }
}

debugMarketQuotesController().catch(console.error);