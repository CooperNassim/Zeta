const { pool } = require('./src/config/database');

async function initData() {
  try {
    // 初始化 stock_pool (股票池) - 没有外键约束
    const stockPool = [
      { symbol: '000001', name: '平安银行', market: 'cn', exchange: '深交所', sector: '银行', current_price: 10.5, change: 0.15, change_percent: 1.45, volume: 52000000, created_at: new Date() },
      { symbol: '600036', name: '招商银行', market: 'cn', exchange: '上交所', sector: '银行', current_price: 35.2, change: 0.5, change_percent: 1.44, volume: 28000000, created_at: new Date() },
      { symbol: '600519', name: '贵州茅台', market: 'cn', exchange: '上交所', sector: '白酒', current_price: 1680, change: -12, change_percent: -0.71, volume: 2500000, created_at: new Date() },
      { symbol: '000333', name: '美的集团', market: 'cn', exchange: '深交所', sector: '家电', current_price: 62.8, change: 1.2, change_percent: 1.95, volume: 35000000, created_at: new Date() },
      { symbol: '601318', name: '中国平安', market: 'cn', exchange: '上交所', sector: '保险', current_price: 45.6, change: -0.8, change_percent: -1.72, volume: 48000000, created_at: new Date() },
    ];

    console.log('正在初始化 stock_pool...');
    for (const s of stockPool) {
      await pool.query(
        `INSERT INTO stock_pool (symbol, name, market, exchange, sector, current_price, change, change_percent, volume, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [s.symbol, s.name, s.market, s.exchange, s.sector, s.current_price, s.change, s.change_percent, s.volume, s.created_at]
      );
    }
    console.log(`已插入 ${stockPool.length} 条 stock_pool`);

    console.log('\n数据初始化完成！');
  } catch (error) {
    console.error('初始化失败:', error.message);
  } finally {
    pool.end();
  }
}

initData();
