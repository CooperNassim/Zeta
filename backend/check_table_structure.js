const { pool } = require('./src/config/database');

async function checkTableStructure() {
  const client = await pool.connect();
  try {
    console.log('🔍 检查表结构...\n');

    // 检查market_quotes表结构
    const marketResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'market_quotes'
      ORDER BY ordinal_position
    `);
    console.log('📊 market_quotes表结构:');
    marketResult.rows.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n📊 stock_pool表结构:');
    // 检查stock_pool表结构
    const poolResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'stock_pool'
      ORDER BY ordinal_position
    `);
    poolResult.rows.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 检查实际的数据尝试插入
    console.log('\n🔧 尝试直接插入测试数据验证表结构...');
    
    const testStock = {
      symbol: '301563',
      name: '测试股票301563', 
      current_price: 15.68,
      prev_close: 15.50,
      change_percent: 1.16,
      volume: 1589000,
      high_price: 15.80,
      low_price: 15.45,
      open_price: 15.55,
      amount: 24800000.00,
      market: 'sz',
      timestamp: new Date().toISOString()
    };

    try {
      await client.query('BEGIN');
      
      // 尝试插入market_quotes表
      const insertResult = await client.query(`
        INSERT INTO market_quotes (
          symbol, name, current_price, prev_close, change_percent, 
          volume, high_price, low_price, open_price, amount, 
          market, timestamp, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
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
        testStock.symbol, testStock.name, testStock.current_price, testStock.prev_close,
        testStock.change_percent, testStock.volume, testStock.high_price, 
        testStock.low_price, testStock.open_price, testStock.amount,
        testStock.market, testStock.timestamp
      ]);

      console.log('✅ market_quotes表插入成功，ID:', insertResult.rows[0].id);

      // 同步插入stock_pool表
      const poolInsertResult = await client.query(`
        INSERT INTO stock_pool (
          symbol, name, market, exchange, sector, current_price, change_percent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (symbol) DO UPDATE SET
          name = EXCLUDED.name,
          market = EXCLUDED.market,
          exchange = EXCLUDED.exchange,
          sector = EXCLUDED.sector,
          current_price = EXCLUDED.current_price,
          change_percent = EXCLUDED.change_percent,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [
        testStock.symbol, 
        testStock.name,
        testStock.market,
        testStock.market === 'sh' ? '上交所' : '深交所',
        '通用',
        testStock.current_price,
        testStock.change_percent
      ]);

      console.log('✅ stock_pool表同步成功，ID:', poolInsertResult.rows[0].id);

      await client.query('COMMIT');
      console.log('\n🎉 双表插入测试成功！');

    } catch (insertError) {
      await client.query('ROLLBACK');
      console.error('❌ 表插入失败:', insertError);
      console.error('错误详情:', insertError.message);
    }

  } catch (error) {
    console.error('检查表结构失败:', error);
  } finally {
    client.release();
  }
}

checkTableStructure().catch(console.error);