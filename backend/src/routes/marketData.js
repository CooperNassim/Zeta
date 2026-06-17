const https = require('https');

const TUSHARE_API_TOKEN = process.env.TUSHARE_TOKEN || '';

async function fetchTushareKline(symbol, period = 'D', limit = 120) {
  if (!TUSHARE_API_TOKEN) {
    throw new Error('Tushare API Token 未配置');
  }
  try {
    let tsCode = symbol;
    if (!symbol.includes('.')) {
      const suffix = symbol.startsWith('6') || symbol.startsWith('9') || symbol.startsWith('1') ? 'SH' : 'SZ';
      tsCode = `${symbol}.${suffix}`;
    }
    
    const endDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const startDate = new Date(Date.now() - limit * 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
    
    const requestBody = {
      api_name: 'daily',
      token: TUSHARE_API_TOKEN,
      params: { 
        ts_code: tsCode, 
        start_date: startDate,
        end_date: endDate
      },
      fields: 'trade_date,open,high,low,close,vol,amount',
    };

    const response = await fetch('https://api.tushare.pro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (data.code !== 0) {
      throw new Error(data.msg || 'Tushare K线请求失败');
    }

    const fields = data.data.fields;
    const items = data.data.items || [];

    return items.map(item => {
      const row = {};
      fields.forEach((f, i) => { row[f] = item[i]; });
      return {
        date: row.trade_date,
        open: parseFloat(row.open),
        high: parseFloat(row.high),
        low: parseFloat(row.low),
        close: parseFloat(row.close),
        volume: parseFloat(row.vol),
        amount: parseFloat(row.amount),
      };
    }).reverse();
  } catch (e) {
    console.error('[Tushare] fetchKline error:', e.message);
    throw e;
  }
}

async function fetchAKShareKline(symbol, period = 'day', limit = 120) {
  const response = await fetch(
    `https://stock.xueqiu.com/v5/stock/chart/kline.json?symbol=${symbol}&begin=0&count=${limit}&period=day&type=before&indicator=kline`
  );

  const data = await response.json();

  if (data.data && data.data.item && data.data.item.length > 0) {
    const columns = data.data.column || [];
    return data.data.item.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return {
        date: obj.timestamp ? new Date(obj.timestamp).toISOString().slice(0, 10) : '',
        open: parseFloat(obj.open) || 0,
        close: parseFloat(obj.close) || 0,
        high: parseFloat(obj.high) || 0,
        low: parseFloat(obj.low) || 0,
        volume: parseFloat(obj.volume) || 0,
      };
    });
  }

  return [];
}

async function fetchSinaKline(symbol, period = 'day', limit = 120) {
  try {
    const prefix = symbol.startsWith('6') ? 'sh' : 'sz';
    const url = `https://quotes.sina.cn/cn/api/json_v2.php/CN_MarketDataService.getKLineData?symbol=${prefix}${symbol}&scale=240&ma=no&datalen=${limit}`;

    const response = await fetch(url, {
      headers: {
        'Referer': 'https://finance.sina.com.cn/',
      },
    });

    const text = await response.text();
    const data = JSON.parse(text);

    if (Array.isArray(data) && data.length > 0) {
      return data.map(item => {
        if (typeof item === 'object' && item.day) {
          return {
            date: item.day,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            volume: parseFloat(item.volume) || 0,
          };
        } else if (Array.isArray(item)) {
          return {
            date: item[0],
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5]) || 0,
          };
        }
        return null;
      }).filter(Boolean);
    }

    return [];
  } catch (e) {
    console.error('[Sina] fetchKline error:', e.message);
    throw e;
  }
}

async function fetchEastmoneyKline(symbol, period = 'D', limit = 120) {
  try {
    let secid = symbol;
    if (!symbol.includes('.')) {
      const prefix = symbol.startsWith('6') || symbol.startsWith('9') || symbol.startsWith('1') ? '1' : '0';
      secid = `${prefix}.${symbol}`;
    }

    const freqMap = {
      'D': '101', 'W': '102', 'M': '103',
      '1m': '1', '5m': '5', '15m': '15', '30m': '30', '60m': '60',
      'day': '101', 'week': '102', 'month': '103',
    };
    const freq = freqMap[period] || '101';

    const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=${freq}&fqt=1&end=20500101&lmt=${limit}`;

    const data = await new Promise((resolve, reject) => {
      const req = https.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`JSON parse error: ${e.message}`));
          }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });

    if (data.data && data.data.klines) {
      return data.data.klines.map(line => {
        const parts = line.split(',');
        return {
          date: parts[0],
          open: parseFloat(parts[1]),
          close: parseFloat(parts[2]),
          high: parseFloat(parts[3]),
          low: parseFloat(parts[4]),
          volume: parseFloat(parts[5]),
          amount: parseFloat(parts[6]),
        };
      });
    }

    console.warn(`[fetchEastmoneyKline] ${symbol} 无K线数据:`, JSON.stringify(data).slice(0, 200));
    return [];
  } catch (error) {
    console.error(`[fetchEastmoneyKline] ${symbol} 获取失败:`, error.message);
    throw new Error(`fetch failed: ${error.message}`);
  }
}

async function fetchYahooKline(symbol, period = '1d', range = '3mo') {
  const intervalMap = { D: '1d', W: '1wk', M: '1mo' };
  const interval = intervalMap[period] || '1d';

  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    }
  );

  const data = await response.json();

  if (data.chart && data.chart.result && data.chart.result[0]) {
    const result = data.chart.result[0];
    const timestamps = result.timestamp || [];
    const quote = result.indicators.quote[0] || {};

    return timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().slice(0, 10),
      open: parseFloat(quote.open?.[i]) || null,
      high: parseFloat(quote.high?.[i]) || null,
      low: parseFloat(quote.low?.[i]) || null,
      close: parseFloat(quote.close?.[i]) || null,
      volume: parseFloat(quote.volume?.[i]) || 0,
    }));
  }

  return [];
}

async function fetchPolygonKline(symbol, apiKey, period = 'day', limit = 120) {
  const multiplierMap = { D: 1, W: 7, M: 30 };
  const timespanMap = { D: 'day', W: 'week', M: 'month' };
  const multiplier = multiplierMap[period] || 1;
  const timespan = timespanMap[period] || 'day';

  const response = await fetch(
    `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/2020-01-01/2099-12-31?apiKey=${apiKey}`
  );

  const data = await response.json();

  if (data.results) {
    return data.results.map(item => ({
      date: new Date(item.t).toISOString().slice(0, 10),
      open: parseFloat(item.o),
      high: parseFloat(item.h),
      low: parseFloat(item.l),
      close: parseFloat(item.c),
      volume: parseFloat(item.v),
    }));
  }

  return [];
}

async function fetchLongportKline(symbol) {
  try {
    const response = await fetch(
      `https://openapi.longportapp.com/openapi/quote/v1/security/candlestick?symbol=${symbol}&period=DAY&count=120`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.data && data.data.candlesticks) {
      return data.data.candlesticks.map(item => ({
        date: item.timestamp,
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume),
      }));
    }

    return [];
  } catch (e) {
    console.error('[Longport] fetchKline error:', e.message);
    throw e;
  }
}

module.exports = {
  fetchTushareKline,
  fetchAKShareKline,
  fetchSinaKline,
  fetchEastmoneyKline,
  fetchYahooKline,
  fetchPolygonKline,
  fetchLongportKline,
};
