// 选股筛选引擎
// 根据结构化的选股条件，筛选符合条件的股票

const { pool } = require('../config/database');
const { fetchEastmoneyStocks } = require('./marketData');

// 字段名映射（前端指标类型 → 数据库字段）
const FIELD_MAP = {
  // 均线
  MA: 'ma',
  EMA: 'ema',
  EXPMA: 'ema',
  SMA: 'sma',
  
  // 布林带
  BOLL_UPPER: 'boll_upper',
  BOLL_MID: 'boll_mid',
  BOLL_LOWER: 'boll_lower',
  
  // MACD
  MACD_DIF: 'macd_dif',
  MACD_DEA: 'macd_dea',
  MACD_HIST: 'macd_hist',
  
  // RSI
  RSI: 'rsi',
  
  // KDJ
  KDJ_K: 'kdj_k',
  KDJ_D: 'kdj_d',
  KDJ_J: 'kdj_j',
  
  // 价格
  PRICE: 'close',
  CLOSE: 'close',
  OPEN: 'open',
  HIGH: 'high',
  LOW: 'low',
  
  // 成交量/额
  VOLUME: 'volume',
  AMOUNT: 'amount',
  
  // 涨跌幅
  CHANGE_PERCENT: 'change_percent',
  
  // 换手率
  TURNOVER_RATE: 'turnover_rate',
  
  // 振幅
  AMPLITUDE: 'amplitude',
};

// 操作符映射
const OP_MAP = {
  GT: '>',
  GTE: '>=',
  LT: '<',
  LTE: '<=',
  EQ: '=',
};

/**
 * 获取全市场股票数据（带实时行情）
 */
async function fetchAllStocksWithQuotes() {
  try {
    // 从东方财富获取全市场股票
    const stocks = await fetchEastmoneyStocks();
    return stocks;
  } catch (error) {
    console.error('[StockScreener] 获取股票数据失败:', error);
    return [];
  }
}

/**
 * 获取股票的技术指标数据（从预计算表）
 */
async function getStockIndicators(symbol, period = 'D') {
  try {
    const result = await pool.query(
      `SELECT * FROM stock_indicators 
       WHERE symbol = $1 AND period = $2 
       ORDER BY trade_date DESC 
       LIMIT 100`,
      [symbol, period]
    );
    return result.rows;
  } catch (error) {
    console.error(`[StockScreener] 获取 ${symbol} 指标数据失败:`, error);
    return [];
  }
}

/**
 * 获取单只股票的最新K线数据（用于实时计算指标）
 */
async function getStockKlineData(symbol, period = 'D', limit = 100) {
  try {
    const tableName = `stock_${period === 'D' ? 'daily' : period === 'W' ? 'weekly' : 'monthly'}`;
    const result = await pool.query(
      `SELECT * FROM ${tableName} 
       WHERE symbol = $1 
       ORDER BY trade_date DESC 
       LIMIT $2`,
      [symbol, limit]
    );
    return result.rows.reverse(); // 按时间正序返回
  } catch (error) {
    console.error(`[StockScreener] 获取 ${symbol} K线数据失败:`, error);
    return [];
  }
}

/**
 * 计算均线值
 */
function calcMA(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j];
      }
      result.push(sum / period);
    }
  }
  return result;
}

/**
 * 计算EMA值
 */
function calcEMA(data, period) {
  const result = [];
  const multiplier = 2 / (period + 1);
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(data[i]);
    } else {
      result.push((data[i] - result[i - 1]) * multiplier + result[i - 1]);
    }
  }
  return result;
}

/**
 * 计算布林带
 */
function calcBOLL(data, period = 20, stdDev = 2) {
  const mid = calcMA(data, period);
  const upper = [];
  const lower = [];
  
  for (let i = 0; i < data.length; i++) {
    if (mid[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      let sumSq = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sumSq += Math.pow(data[j] - mid[i], 2);
      }
      const std = Math.sqrt(sumSq / period);
      upper.push(mid[i] + stdDev * std);
      lower.push(mid[i] - stdDev * std);
    }
  }
  
  return { mid, upper, lower };
}

/**
 * 计算MACD
 */
function calcMACD(data, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
  const emaShort = calcEMA(data, shortPeriod);
  const emaLong = calcEMA(data, longPeriod);
  const dif = emaShort.map((v, i) => v - emaLong[i]);
  const dea = calcEMA(dif, signalPeriod);
  const hist = dif.map((v, i) => (v - dea[i]) * 2);
  
  return { dif, dea, hist };
}

/**
 * 计算RSI
 */
function calcRSI(data, period = 14) {
  const result = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(null);
    } else {
      let gains = 0;
      let losses = 0;
      
      for (let j = i - period + 1; j <= i; j++) {
        const change = data[j] - data[j - 1];
        if (change > 0) {
          gains += change;
        } else {
          losses -= change;
        }
      }
      
      const avgGain = gains / period;
      const avgLoss = losses / period;
      
      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        result.push(100 - 100 / (1 + rs));
      }
    }
  }
  
  return result;
}

/**
 * 计算KDJ
 */
function calcKDJ(highs, lows, closes, n = 9, m1 = 3, m2 = 3) {
  const kValues = [];
  const dValues = [];
  const jValues = [];
  
  let prevK = 50;
  let prevD = 50;
  
  for (let i = 0; i < closes.length; i++) {
    if (i < n - 1) {
      kValues.push(null);
      dValues.push(null);
      jValues.push(null);
    } else {
      const hhv = Math.max(...highs.slice(i - n + 1, i + 1));
      const llv = Math.min(...lows.slice(i - n + 1, i + 1));
      
      const rsv = hhv === llv ? 50 : ((closes[i] - llv) / (hhv - llv)) * 100;
      
      const k = ((m1 - 1) * prevK + rsv) / m1;
      const d = ((m2 - 1) * prevD + k) / m2;
      const j = 3 * k - 2 * d;
      
      kValues.push(k);
      dValues.push(d);
      jValues.push(j);
      
      prevK = k;
      prevD = d;
    }
  }
  
  return { k: kValues, d: dValues, j: jValues };
}

/**
 * 实时计算技术指标（当预计算数据不足时）
 */
function calculateIndicatorsOnTheFly(klineData, period = 'D') {
  if (!klineData || klineData.length < 60) return null;
  
  const closes = klineData.map(d => parseFloat(d.close));
  const highs = klineData.map(d => parseFloat(d.high));
  const lows = klineData.map(d => parseFloat(d.low));
  const volumes = klineData.map(d => parseFloat(d.volume));
  
  const ma5 = calcMA(closes, 5);
  const ma10 = calcMA(closes, 10);
  const ma20 = calcMA(closes, 20);
  const ma30 = calcMA(closes, 30);
  const ma60 = calcMA(closes, 60);
  
  const ema5 = calcEMA(closes, 5);
  const ema10 = calcEMA(closes, 10);
  const ema13 = calcEMA(closes, 13);
  const ema20 = calcEMA(closes, 20);
  const ema26 = calcEMA(closes, 26);
  
  const boll = calcBOLL(closes, 20, 2);
  const macd = calcMACD(closes, 12, 26, 9);
  const rsi6 = calcRSI(closes, 6);
  const rsi12 = calcRSI(closes, 12);
  const rsi24 = calcRSI(closes, 24);
  const kdj = calcKDJ(highs, lows, closes, 9, 3, 3);
  
  // 返回最后一天的指标值
  const lastIdx = closes.length - 1;
  
  return {
    ma5: ma5[lastIdx],
    ma10: ma10[lastIdx],
    ma20: ma20[lastIdx],
    ma30: ma30[lastIdx],
    ma60: ma60[lastIdx],
    ema5: ema5[lastIdx],
    ema10: ema10[lastIdx],
    ema13: ema13[lastIdx],
    ema20: ema20[lastIdx],
    ema26: ema26[lastIdx],
    boll_mid: boll.mid[lastIdx],
    boll_upper: boll.upper[lastIdx],
    boll_lower: boll.lower[lastIdx],
    macd_dif: macd.dif[lastIdx],
    macd_dea: macd.dea[lastIdx],
    macd_hist: macd.hist[lastIdx],
    rsi6: rsi6[lastIdx],
    rsi12: rsi12[lastIdx],
    rsi24: rsi24[lastIdx],
    kdj_k: kdj.k[lastIdx],
    kdj_d: kdj.d[lastIdx],
    kdj_j: kdj.j[lastIdx],
    volume: volumes[lastIdx],
    close: closes[lastIdx],
    high: highs[lastIdx],
    low: lows[lastIdx],
    open: parseFloat(klineData[lastIdx].open),
  };
}

/**
 * 获取指标值（优先从预计算表，其次实时计算）
 */
async function getIndicatorValue(stock, indicatorType, period = 'D', param = null, lookbackDays = 100) {
  // 先尝试从预计算表获取
  const indicators = await getStockIndicators(stock.symbol, period);
  
  if (indicators && indicators.length > 0) {
    const latest = indicators[0]; // 按trade_date DESC排序，第一个是最新的
    
    // 指标字段映射
    const indicatorFieldMap = {
      MA: param ? `ma${param}` : 'ma5',
      EMA: param ? `ma${param}` : 'ema5',
      EXPMA: param ? `ma${param}` : 'ma5',
      BOLL_UPPER: 'boll_upper',
      BOLL_MID: 'boll_mid',
      BOLL_LOWER: 'boll_lower',
      MACD_DIF: 'macd_dif',
      MACD_DEA: 'macd_dea',
      MACD_HIST: 'macd_hist',
      RSI: param ? `rsi${param}` : 'rsi14',
      KDJ_K: 'kdj_k',
      KDJ_D: 'kdj_d',
      KDJ_J: 'kdj_j',
      PRICE: 'close',
      CLOSE: 'close',
      OPEN: 'open',
      HIGH: 'high',
      LOW: 'low',
      VOLUME: 'volume',
      AMOUNT: 'amount',
      CHANGE_PERCENT: 'change_percent',
    };
    
    const field = indicatorFieldMap[indicatorType];
    if (field && latest[field] !== undefined && latest[field] !== null) {
      return parseFloat(latest[field]);
    }
  }
  
  // 预计算数据不足，尝试实时计算
  const klineData = await getStockKlineData(stock.symbol, period, lookbackDays);
  if (klineData && klineData.length >= 60) {
    const calculated = calculateIndicatorsOnTheFly(klineData, period);
    if (calculated) {
      // 指标值映射
      const calcFieldMap = {
        MA: param ? `ma${param}` : 'ma5',
        EMA: param ? `ema${param}` : 'ema5',
        EXPMA: param ? `ema${param}` : 'ema5',
        BOLL_UPPER: 'boll_upper',
        BOLL_MID: 'boll_mid',
        BOLL_LOWER: 'boll_lower',
        MACD_DIF: 'macd_dif',
        MACD_DEA: 'macd_dea',
        MACD_HIST: 'macd_hist',
        RSI: param ? `rsi${param}` : 'rsi14',
        KDJ_K: 'kdj_k',
        KDJ_D: 'kdj_d',
        KDJ_J: 'kdj_j',
        PRICE: 'close',
        CLOSE: 'close',
        OPEN: 'open',
        HIGH: 'high',
        LOW: 'low',
        VOLUME: 'volume',
      };
      
      const field = calcFieldMap[indicatorType];
      if (field && calculated[field] !== undefined && calculated[field] !== null) {
        return calculated[field];
      }
    }
  }
  
  return null;
}

/**
 * 获取前N天的指标值（用于比较类条件，如"5日均线 > 10日均线"）
 */
async function getIndicatorValueDaysAgo(stock, indicatorType, period, param, daysAgo, lookbackDays = 100) {
  const klineData = await getStockKlineData(stock.symbol, period, lookbackDays + daysAgo);
  
  if (!klineData || klineData.length < 60) return null;
  
  const calculated = calculateIndicatorsOnTheFly(klineData, period);
  if (!calculated) return null;
  
  // 注意：这里简化处理，实际应该获取daysAgo天前的数据
  // 由于需要大量历史数据，这里简化为使用最新值
  return calculated[indicatorType.toLowerCase()] || calculated['ma5'] || null;
}

/**
 * 评估单个条件
 */
async function evaluateCondition(stock, condition, period = 'D') {
  // 特殊条件处理
  if (condition.type === 'special') {
    const { type, value } = condition.condition;
    
    if (type === 'exclude_exchange') {
      // 排除特定交易所
      if (value === '北交所' && stock.exchange === 'BJ') return false;
      if (value === '科创板' && stock.symbol.startsWith('68')) return false;
      if (value === '创业板' && (stock.symbol.startsWith('30') || stock.symbol.startsWith('300'))) return false;
      return true;
    }
    
    if (type === 'exclude_keyword') {
      // 排除包含特定关键词的股票（如ST）
      if (stock.name && stock.name.toUpperCase().includes(value.toUpperCase())) return false;
      return true;
    }
    
    if (type === 'only_main_board') {
      // 仅主板（排除科创板、创业板、北交所）
      const isMainBoard = !stock.symbol.startsWith('68') && 
                          !stock.symbol.startsWith('30') && 
                          !stock.symbol.startsWith('300') &&
                          stock.exchange !== 'BJ';
      return isMainBoard;
    }
    
    if (type === 'limit_up') {
      // 涨停
      return stock.changePercent >= 9.8;
    }
    
    if (type === 'limit_down') {
      // 跌停
      return stock.changePercent <= -9.8;
    }
    
    return true;
  }
  
  // 指标比较条件: A > B
  if (condition.type === 'comparison') {
    const leftValue = await getIndicatorValue(stock, condition.left.type, condition.left.period || period, condition.left.param);
    const rightValue = await getIndicatorValue(stock, condition.right.type, condition.right.period || period, condition.right.param);
    
    if (leftValue === null || rightValue === null) return false;
    
    const op = OP_MAP[condition.operator];
    if (!op) return false;
    
    switch (op) {
      case '>': return leftValue > rightValue;
      case '>=': return leftValue >= rightValue;
      case '<': return leftValue < rightValue;
      case '<=': return leftValue <= rightValue;
      case '=': return Math.abs(leftValue - rightValue) < 0.0001;
      default: return false;
    }
  }
  
  // 数值比较条件: A > 数值
  if (condition.type === 'value_comparison') {
    const leftValue = await getIndicatorValue(stock, condition.left.type, condition.left.period || period, condition.left.param);
    
    if (leftValue === null) return false;
    
    const op = OP_MAP[condition.operator];
    if (!op) return false;
    
    switch (op) {
      case '>': return leftValue > condition.value;
      case '>=': return leftValue >= condition.value;
      case '<': return leftValue < condition.value;
      case '<=': return leftValue <= condition.value;
      case '=': return Math.abs(leftValue - condition.value) < 0.0001;
      default: return false;
    }
  }
  
  return false;
}

/**
 * 筛选股票
 */
async function screenStocks(conditions, options = {}) {
  const { period = 'D', limit = 100 } = options;
  
  console.log(`[StockScreener] 开始筛选，条件数量: ${conditions.length}, 周期: ${period}`);
  
  // 获取全市场股票
  const allStocks = await fetchAllStocksWithQuotes();
  console.log(`[StockScreener] 获取到 ${allStocks.length} 只股票`);
  
  // 筛选符合条件的股票
  const matchedStocks = [];
  
  for (const stock of allStocks) {
    // 所有条件都必须满足（AND逻辑）
    let allConditionsMet = true;
    
    for (const condition of conditions) {
      const met = await evaluateCondition(stock, condition, period);
      if (!met) {
        allConditionsMet = false;
        break;
      }
    }
    
    if (allConditionsMet) {
      matchedStocks.push(stock);
      
      // 达到限制数量则停止
      if (matchedStocks.length >= limit) break;
    }
  }
  
  console.log(`[StockScreener] 筛选完成，匹配 ${matchedStocks.length} 只股票`);
  
  return matchedStocks;
}

module.exports = {
  screenStocks,
  evaluateCondition,
  getIndicatorValue,
  calculateIndicatorsOnTheFly,
  fetchAllStocksWithQuotes,
};
