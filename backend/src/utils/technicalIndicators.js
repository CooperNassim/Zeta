/**
 * 后端技术指标计算工具函数
 * 用于预计算技术指标并存储到数据库
 */

/**
 * 计算简单移动平均线 (SMA)
 */
function calculateSMA(closes, period) {
  const result = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += closes[j];
      }
      result.push(sum / period);
    }
  }
  return result;
}

/**
 * 计算指数移动平均线 (EMA)
 */
function calculateEMA(closes, period) {
  const result = [];
  if (closes.length < period) return result;
  
  const k = 2 / (period + 1);
  
  // 第一个EMA值使用SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += closes[i];
  }
  
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      result.push(sum / period);
    } else {
      result.push(closes[i] * k + result[i - 1] * (1 - k));
    }
  }
  return result;
}

/**
 * 计算布林带
 * 中轨=MA20, 上轨=中轨+2*标准差, 下轨=中轨-2*标准差
 */
function calculateBOLL(closes, period = 20, stdDev = 2) {
  const middle = calculateSMA(closes, period);
  const upper = [];
  const lower = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (middle[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      // 计算标准差
      let variance = 0;
      for (let j = i - period + 1; j <= i; j++) {
        variance += Math.pow(closes[j] - middle[i], 2);
      }
      const std = Math.sqrt(variance / period);
      upper.push(middle[i] + stdDev * std);
      lower.push(middle[i] - stdDev * std);
    }
  }
  
  return { middle, upper, lower };
}

/**
 * 计算MACD
 * DIF = EMA(12) - EMA(26)
 * DEA = EMA(DIF, 9)
 * MACD柱 = 2 * (DIF - DEA)
 */
function calculateMACD(closes) {
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  
  const dif = [];
  for (let i = 0; i < closes.length; i++) {
    if (ema12[i] !== null && ema26[i] !== null) {
      dif.push(ema12[i] - ema26[i]);
    } else {
      dif.push(null);
    }
  }
  
  // DEA = EMA(DIF, 9)
  const dea = [];
  const validDifIndices = [];
  const validDifValues = [];
  
  for (let i = 0; i < dif.length; i++) {
    if (dif[i] !== null) {
      validDifIndices.push(i);
      validDifValues.push(dif[i]);
    }
  }
  
  const deaOfDif = calculateEMA(validDifValues, 9);
  
  let deaIndex = 0;
  for (let i = 0; i < dif.length; i++) {
    if (dif[i] === null) {
      dea.push(null);
    } else {
      dea.push(deaOfDif[deaIndex] || null);
      deaIndex++;
    }
  }
  
  const hist = [];
  for (let i = 0; i < closes.length; i++) {
    if (dif[i] !== null && dea[i] !== null) {
      hist.push(2 * (dif[i] - dea[i]));
    } else {
      hist.push(null);
    }
  }
  
  return { dif, dea, hist };
}

/**
 * 计算RSI (相对强弱指标)
 */
function calculateRSI(closes, periods = [6, 12, 24]) {
  const results = {};
  
  for (const period of periods) {
    const rsi = [];
    let avgGain = 0;
    let avgLoss = 0;
    
    for (let i = 0; i < closes.length; i++) {
      if (i === 0) {
        rsi.push(null);
        continue;
      }
      
      const change = closes[i] - closes[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;
      
      if (i <= period) {
        avgGain = (avgGain * (i - 1) + gain) / i;
        avgLoss = (avgLoss * (i - 1) + loss) / i;
        
        if (i < period) {
          rsi.push(null);
        } else {
          const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
          rsi.push(100 - (100 / (1 + rs)));
        }
      } else {
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
    
    results[`rsi${period}`] = rsi;
  }
  
  return results;
}

/**
 * 计算KDJ (随机指标)
 * RSV = (C - L9) / (H9 - L9) * 100
 * K = 2/3 * 前K + 1/3 * RSV
 * D = 2/3 * 前D + 1/3 * K
 * J = 3K - 2D
 */
function calculateKDJ(highs, lows, closes, period = 9) {
  const k = [];
  const d = [];
  const j = [];
  
  let prevK = 50;
  let prevD = 50;
  
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      k.push(null);
      d.push(null);
      j.push(null);
      continue;
    }
    
    // 计算N日内的最高价和最低价
    let highest = -Infinity;
    let lowest = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (highs[j] > highest) highest = highs[j];
      if (lows[j] < lowest) lowest = lows[j];
    }
    
    const rsv = highest === lowest ? 50 : ((closes[i] - lowest) / (highest - lowest)) * 100;
    
    const currentK = (2 / 3) * prevK + (1 / 3) * rsv;
    const currentD = (2 / 3) * prevD + (1 / 3) * currentK;
    const currentJ = 3 * currentK - 2 * currentD;
    
    k.push(currentK);
    d.push(currentD);
    j.push(currentJ);
    
    prevK = currentK;
    prevD = currentD;
  }
  
  return { k, d, j };
}

/**
 * 计算所有技术指标
 * @param {Array} klineData - K线数据 [{ date, open, high, low, close, volume }]
 * @param {number} minBars - 最少需要的数据条数（默认30）
 * @returns {Array} 包含技术指标的数组
 */
function calculateAllIndicators(klineData, minBars = 30) {
  if (!klineData || klineData.length < minBars) return [];
  
  const closes = klineData.map(k => k.close);
  const highs = klineData.map(k => k.high);
  const lows = klineData.map(k => k.low);
  
  // 计算各类指标
  const ma5 = calculateSMA(closes, 5);
  const ma10 = calculateSMA(closes, 10);
  const ma20 = calculateSMA(closes, 20);
  const ma30 = calculateSMA(closes, 30);
  const ma60 = calculateSMA(closes, 60);
  
  const boll = calculateBOLL(closes, 20, 2);
  const macd = calculateMACD(closes);
  const rsi = calculateRSI(closes);
  const kdj = calculateKDJ(highs, lows, closes, 9);
  
  // 组合结果
  return klineData.map((item, i) => ({
    date: item.date,
    ma5: ma5[i],
    ma10: ma10[i],
    ma20: ma20[i],
    ma30: ma30[i],
    ma60: ma60[i],
    bollMid: boll.middle[i],
    bollUpper: boll.upper[i],
    bollLower: boll.lower[i],
    macdDif: macd.dif[i],
    macdDea: macd.dea[i],
    macdHist: macd.hist[i],
    rsi6: rsi.rsi6[i],
    rsi12: rsi.rsi12[i],
    rsi24: rsi.rsi24[i],
    kdjK: kdj.k[i],
    kdjD: kdj.d[i],
    kdjJ: kdj.j[i],
  }));
}

module.exports = {
  calculateAllIndicators,
  calculateSMA,
  calculateEMA,
  calculateBOLL,
  calculateMACD,
  calculateRSI,
  calculateKDJ,
};
