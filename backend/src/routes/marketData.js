const { pool } = require('../config/database');
const { createTask, getTask, updateTask, completeTask, failTask, isStopRequested } = require('../utils/taskManager');
const { calculateAllIndicators } = require('../utils/technicalIndicators');

const TUSHARE_API_TOKEN = process.env.TUSHARE_TOKEN || '1e36902ffc499ce3e3bd2a2690764a21d2c2068cee90b00b2893342d';

const MARKET_PROVIDERS = {
  tushare: {
    label: 'Tushare',
    market: 'A股',
    fetchStocks: fetchTushareStocks,
    fetchKline: fetchTushareKline,
    needApiKey: true,
  },
  akshare: {
    label: 'AKShare',
    market: 'A股',
    fetchStocks: fetchAKShareStocks,
    fetchKline: fetchAKShareKline,
    needApiKey: false,
  },
  sina: {
    label: '新浪财经',
    market: 'A股',
    fetchStocks: fetchSinaStocks,
    fetchKline: fetchSinaKline,
    needApiKey: false,
  },
  eastmoney: {
    label: '东方财富',
    market: 'A股',
    fetchStocks: fetchEastmoneyStocks,
    fetchKline: fetchEastmoneyKline,
    needApiKey: false,
  },
  yahoo: {
    label: 'Yahoo Finance',
    market: '美股',
    fetchStocks: fetchYahooStocks,
    fetchKline: fetchYahooKline,
    needApiKey: false,
  },
  polygon: {
    label: 'Polygon.io',
    market: '美股',
    fetchStocks: fetchPolygonStocks,
    fetchKline: fetchPolygonKline,
    needApiKey: true,
  },
  longport: {
    label: 'Longport',
    market: '港股',
    fetchStocks: fetchLongportStocks,
    fetchKline: fetchLongportKline,
    needApiKey: true,
  },
};

function getProvider(provider) {
  return MARKET_PROVIDERS[provider?.toLowerCase()];
}

async function fetchTushareStocks() {
  try {
    // 尝试从 stock_pool 缓存读取股票基本信息（stock_basic 限频 1次/小时）
    const cachedResult = await pool.query(
      `SELECT symbol, name, market, current_price, change_percent, volume,
              open_price, high_price, low_price
       FROM stock_pool WHERE market = 'cn' AND deleted = false
       ORDER BY symbol`
    );

    let basicItems = cachedResult.rows.map(row => ({
      symbol: row.symbol,
      name: row.name,
      currentPrice: row.current_price,
      changePercent: row.change_percent,
      volume: row.volume,
      openPrice: row.open_price,
      highPrice: row.high_price,
      lowPrice: row.low_price,
    }));

    // 如果缓存少于 1000 条，才调用 stock_basic API
    if (basicItems.length < 1000) {
      console.log('[Tushare] 缓存数据不足，调用 stock_basic API');
      const basicRequestBody = {
        api_name: 'stock_basic',
        token: TUSHARE_API_TOKEN,
        params: { exchange: '', list_status: 'L' },
        fields: 'ts_code,symbol,name,area,industry,market,list_date',
      };

      const basicResponse = await fetch('https://api.tushare.pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basicRequestBody),
      });

      const basicData = await basicResponse.json();

      if (basicData.code !== 0) {
        throw new Error(basicData.msg || 'Tushare stock_basic 请求失败');
      }

      const basicFields = basicData.data.fields;
      basicItems = (basicData.data.items || []).map(item => {
        const row = {};
        basicFields.forEach((f, i) => { row[f] = item[i]; });
        return { symbol: row.symbol || row.ts_code.split('.')[0], name: row.name || '', rawCode: row.ts_code };
      });
      console.log(`[Tushare] 从 API 获取到 ${basicItems.length} 只股票基本信息`);
    } else {
      console.log(`[Tushare] 使用缓存的 ${basicItems.length} 只股票基本信息`);
    }

    // 用 trade_cal 接口一次获取最近交易日，避免逐日测试导致频率限制
    let latestTradeDate = null;
    const now = new Date();

    // 往前最多试 14 天，逐个检查 daily 接口是否有数据
    for (let d = 0; d < 14; d++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() - d);
      const dateStr = checkDate.toISOString().slice(0, 10).replace(/-/g, '');
      const dayOfWeek = checkDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      try {
        const dailyTestRequest = {
          api_name: 'daily',
          token: TUSHARE_API_TOKEN,
          params: { trade_date: dateStr },
          fields: 'ts_code',
        };

        const dailyTestResponse = await fetch('https://api.tushare.pro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dailyTestRequest),
        });

        const dailyTestData = await dailyTestResponse.json();
        if (dailyTestData.code === 0 && dailyTestData.data?.items?.length > 100) {
          latestTradeDate = dateStr;
          console.log(`[Tushare] 最近交易日: ${latestTradeDate} (${d === 0 ? '今天' : d + '天前'})`);
          break;
        }
      } catch (e) {
        console.warn(`[Tushare] 测试日期 ${dateStr} 失败:`, e.message);
      }

      // 每次测试后延迟 1.5 秒，避免频率限制
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    if (!latestTradeDate) {
      latestTradeDate = now.toISOString().slice(0, 10).replace(/-/g, '');
      console.warn(`[Tushare] 未找到交易日，使用当天日期: ${latestTradeDate}`);
    }

    // 获取日线行情
    const dailyRequestBody = {
      api_name: 'daily',
      token: TUSHARE_API_TOKEN,
      params: { trade_date: latestTradeDate },
      fields: 'ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,vol,amount',
    };

    const dailyResponse = await fetch('https://api.tushare.pro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dailyRequestBody),
    });

    const dailyData = await dailyResponse.json();

    if (dailyData.code !== 0 || !dailyData.data) {
      throw new Error(dailyData.msg || 'Tushare daily 请求失败');
    }

    const allDailyItems = dailyData.data?.items || [];
    const dailyFields = dailyData.data?.fields || [];
    console.log(`[Tushare] 获取到 ${allDailyItems.length} 条行情数据`);

    if (allDailyItems.length === 0) {
      throw new Error(`Tushare daily 接口返回 0 条数据（日期: ${latestTradeDate}）`);
    }

    const dailyMap = new Map();
    for (const item of allDailyItems) {
      const row = {};
      dailyFields.forEach((f, i) => { row[f] = item[i]; });
      dailyMap.set(row.ts_code, row);
    }

    return basicItems.map(item => {
      const tsCode = item.rawCode || `${item.symbol}.${item.symbol.startsWith('6') ? 'SH' : 'SZ'}`;
      const symbol = item.symbol || tsCode.split('.')[0];
      const name = item.name || '';
      const daily = dailyMap.get(tsCode);

      return {
        symbol,
        name,
        currentPrice: daily ? parseFloat(daily.close) || null : null,
        changePercent: daily ? parseFloat(daily.pct_chg) || 0 : 0,
        volume: daily ? parseFloat(daily.vol) || 0 : 0,
        openPrice: daily ? parseFloat(daily.open) || null : null,
        highPrice: daily ? parseFloat(daily.high) || null : null,
        lowPrice: daily ? parseFloat(daily.low) || null : null,
        preClose: daily ? parseFloat(daily.pre_close) || null : null,
        changeAmount: daily ? parseFloat(daily.change) || null : null,
        amount: daily ? parseFloat(daily.amount) || null : null,
        tradeDate: daily ? daily.trade_date : latestTradeDate,
        exchange: tsCode.split('.')[1] === 'SH' ? 'SH' : 'SZ',
        rawCode: tsCode,
      };
    }).filter(stock => {
      // 过滤掉指数（399xxx=深证指数，000xxx=上证指数）
      if (stock.symbol.startsWith('399') || stock.symbol.startsWith('000')) return false;
      // 过滤掉名称包含"指"字的指数
      if (stock.name.includes('指') || stock.name.includes('指数')) return false;
      return true;
    });
  } catch (e) {
    console.error('[Tushare] fetchStocks error:', e.message);
    throw e;
  }
}

async function fetchTushareKline(symbol, period = 'D', limit = 120) {
  try {
    const requestBody = {
      api_name: 'daily',
      token: TUSHARE_API_TOKEN,
      params: { ts_code: symbol, limit: limit },
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

async function fetchAKShareStocks() {
  try {
    const allStocks = [];
    let page = 1;
    const maxPages = 60;

    while (page <= maxPages) {
      const url = `https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=${page}&num=100&sort=symbol&asc=0&node=hs_a&symbol=&_s_r_a=init`;

      const response = await fetch(url, {
        headers: {
          'Referer': 'https://finance.sina.com.cn/',
        },
      });

      const text = await response.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        if (page === 1) {
          console.error('[AKShare] API返回数据异常:', JSON.stringify(data).slice(0, 500));
          throw new Error('新浪财经API返回数据格式异常');
        }
        break;
      }

      if (page === 1) {
        console.log(`[AKShare] 第1页获取 ${data.length} 条`);
      }

      const stocks = data.map(item => ({
        symbol: item.code || item.symbol,
        name: item.name || '',
        currentPrice: parseFloat(item.trade) || null,
        changePercent: parseFloat(item.changepercent) || 0,
        volume: parseFloat(item.volume) || 0,
        openPrice: parseFloat(item.open) || null,
        highPrice: parseFloat(item.high) || null,
        lowPrice: parseFloat(item.low) || null,
        exchange: symbol.startsWith('92') ? 'BJ' : symbol.startsWith('6') ? 'SH' : 'SZ',
      }));

      allStocks.push(...stocks);

      if (data.length < 100) break;

      page++;
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log(`[AKShare] 获取到 ${allStocks.length} 条股票数据（新浪财经源）`);
    return allStocks;
  } catch (e) {
    console.error('[AKShare] fetchStocks error:', e.message);
    throw e;
  }
}

async function fetchAKShareKline(symbol, period = 'day', limit = 120) {
  const freqMap = { D: '101', W: '102', M: '103' };
  const freq = freqMap[period] || '101';

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

async function fetchSinaStocks() {
  try {
    const allStocks = [];
    let page = 1;
    const maxPages = 60;

    while (page <= maxPages) {
      const url = `https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=${page}&num=100&sort=symbol&asc=0&node=hs_a&symbol=&_s_r_a=init`;

      const response = await fetch(url, {
        headers: {
          'Referer': 'https://finance.sina.com.cn/',
        },
      });

      const text = await response.text();
      const data = JSON.parse(text);

      if (Array.isArray(data)) {
        const stocks = data.map(item => ({
          symbol: item.symbol,
          name: item.name || '',
          currentPrice: parseFloat(item.trade) || null,
          changePercent: parseFloat(item.changepercent) || 0,
          volume: parseFloat(item.volume) || 0,
          openPrice: parseFloat(item.open) || null,
          highPrice: parseFloat(item.high) || null,
          lowPrice: parseFloat(item.low) || null,
          exchange: item.symbol.startsWith('sh') ? 'SH' : 'SZ',
        }));

        allStocks.push(...stocks);

        if (page === 1) {
          console.log(`[Sina] 第1页获取 ${data.length} 条`);
        }

        if (data.length < 100) {
          break;
        }
      } else {
        break;
      }

      page++;
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log(`[Sina] 获取到 ${allStocks.length} 条股票数据`);
    return allStocks;
  } catch (e) {
    console.error('[Sina] fetchStocks error:', e.message);
    throw e;
  }
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

    if (Array.isArray(data)) {
      return data.map(item => ({
        date: item[0],
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]) || 0,
      }));
    }

    return [];
  } catch (e) {
    console.error('[Sina] fetchKline error:', e.message);
    throw e;
  }
}

async function fetchEastmoneyStocks() {
  try {
    const allStocks = [];
    const pageSize = 100;
    let page = 1;
    let totalCount = 0;

    while (true) {
      const url = `https://push2.eastmoney.com/api/qt/clist/get?pn=${page}&pz=${pageSize}&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81&fields=f12,f14,f2,f3,f5,f17,f15,f16`;

      const response = await fetch(url, {
        headers: {
          'Referer': 'https://quote.eastmoney.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const text = await response.text();
      const data = JSON.parse(text);

      if (data.data && data.data.diff && data.data.diff.length > 0) {
        if (page === 1) {
          totalCount = data.data.total || 0;
          console.log(`[Eastmoney] 总共 ${totalCount} 条数据`);
        }

        const stocks = data.data.diff.map(item => ({
          symbol: item.f12,
          name: item.f14,
          currentPrice: parseFloat(item.f2) || null,
          changePercent: parseFloat(item.f3) || 0,
          volume: parseFloat(item.f5) || 0,
          openPrice: parseFloat(item.f17) || null,
          highPrice: parseFloat(item.f15) || null,
          lowPrice: parseFloat(item.f16) || null,
          exchange: item.f12.startsWith('92') ? 'BJ' : item.f12.startsWith('6') ? 'SH' : 'SZ',
        }));

        allStocks.push(...stocks);
        console.log(`[Eastmoney] 第 ${page} 页获取 ${stocks.length} 条，累计 ${allStocks.length} 条`);

        if (data.data.diff.length < pageSize || allStocks.length >= totalCount) {
          break;
        }

        page++;
      } else {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`[Eastmoney] 获取到 ${allStocks.length} 条股票数据`);
    return allStocks;
  } catch (e) {
    console.error('[Eastmoney] fetchStocks error:', e.message);
    throw e;
  }
}

async function fetchEastmoneyKline(symbol, period = 'D', limit = 120) {
  // 自动格式化 secid: A 股 6 开头为 1.xxx, 0/3 开头为 0.xxx
  let secid = symbol;
  if (!symbol.includes('.')) {
    const prefix = symbol.startsWith('6') || symbol.startsWith('9') || symbol.startsWith('1') ? '1' : '0';
    secid = `${prefix}.${symbol}`;
  }

  // 频率映射: D=日线, W=周线, M=月线, 分钟线如 1m/5m/15m/30m/60m
  const freqMap = {
    'D': '101', 'W': '102', 'M': '103',
    '1m': '1', '5m': '5', '15m': '15', '30m': '30', '60m': '60',
    'day': '101', 'week': '102', 'month': '103',
  };
  const freq = freqMap[period] || '101';

  const response = await fetch(
    `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=${freq}&fqt=1&end=20500101&lmt=${limit}`
  );

  const data = await response.json();

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

  return [];
}

async function fetchYahooStocks(symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD', 'NFLX', 'CRM']) {
  try {
    const symStr = symbols.join('%2C');
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symStr}?range=1d&interval=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      }
    );

    const text = await response.text();
    
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      throw new Error('Yahoo Finance returned HTML instead of JSON (may require cookie authentication)');
    }

    const data = JSON.parse(text);

    if (data.chart && data.chart.result && data.chart.result[0]) {
      return data.chart.result.map(item => {
        const meta = item.meta || {};
        const regularMarketPrice = meta.regularMarketPrice || null;
        const chartPreviousClose = meta.chartPreviousClose || null;
        const changePercent = chartPreviousClose ? ((regularMarketPrice - chartPreviousClose) / chartPreviousClose * 100) : 0;
        return {
          symbol: meta.symbol || '',
          name: meta.shortName || meta.longName || meta.exchangeName || '',
          currentPrice: regularMarketPrice,
          changePercent: parseFloat(changePercent.toFixed(2)),
          volume: meta.regularMarketVolume || 0,
          openPrice: meta.regularMarketOpen || null,
          highPrice: meta.regularMarketDayHigh || null,
          lowPrice: meta.regularMarketDayLow || null,
          exchange: meta.fullExchangeName || meta.exchangeName || '',
        };
      });
    }

    return [];
  } catch (e) {
    console.error('[Yahoo] fetchStocks error:', e.message);
    throw e;
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

async function fetchPolygonStocks(apiKey) {
  try {
    const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?apiKey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.tickers) {
      return data.tickers.map(item => ({
        symbol: item.ticker,
        name: '',
        currentPrice: item.day?.close || null,
        changePercent: parseFloat(item.day?.changePercent) || 0,
        volume: item.day?.volume || 0,
        openPrice: item.day?.open || null,
        highPrice: item.day?.high || null,
        lowPrice: item.day?.low || null,
      }));
    }

    return [];
  } catch (e) {
    console.error('[Polygon] fetchStocks error:', e.message);
    throw e;
  }
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

async function fetchLongportStocks() {
  try {
    const response = await fetch(
      'https://openapi.longportapp.com/openapi/quote/v1/security/static_info?symbol=00700,09988,01810,09618,00388',
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.data && Array.isArray(data.data)) {
      return data.data.map(item => ({
        symbol: item.code || item.symbol,
        name: item.name || '',
        currentPrice: parseFloat(item.last_price || item.price) || null,
        changePercent: parseFloat(item.change_rate || item.change_percent) || 0,
        volume: parseFloat(item.volume) || 0,
      }));
    }

    return [];
  } catch (e) {
    console.error('[Longport] fetchStocks error:', e.message);
    throw e;
  }
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

async function syncTushareDateRange(startDate, endDate, pool, marketCode) {
  try {
    console.log(`[Tushare] 日期区间同步: ${startDate} ~ ${endDate}`);

    // 生成日期列表
    const dates = [];
    const current = new Date(startDate.slice(0, 4) + '-' + startDate.slice(4, 6) + '-' + startDate.slice(6, 8));
    const end = new Date(endDate.slice(0, 4) + '-' + endDate.slice(4, 6) + '-' + endDate.slice(6, 8));

    while (current <= end) {
      const dateStr = current.toISOString().slice(0, 10).replace(/-/g, '');
      dates.push(dateStr);
      current.setDate(current.getDate() + 1);
    }

    console.log(`[Tushare] 共 ${dates.length} 天需要处理`);

    let totalCount = 0;
    let newCount = 0;
    let updatedCount = 0;

    // 逐日同步
    for (const tradeDate of dates) {
      try {
        console.log(`[Tushare] 处理日期: ${tradeDate}`);

        // 获取该日行情数据
        const dailyRequestBody = {
          api_name: 'daily',
          token: TUSHARE_API_TOKEN,
          params: { trade_date: tradeDate },
          fields: 'ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,vol,amount',
        };

        const dailyResponse = await fetch('https://api.tushare.pro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dailyRequestBody),
        });

        const dailyData = await dailyResponse.json();

        if (dailyData.code !== 0 || !dailyData.data || !dailyData.data.items) {
          console.log(`[Tushare] 日期 ${tradeDate} 无数据或请求失败`);
          continue;
        }

        const dailyFields = dailyData.data.fields;
        const dailyItems = dailyData.data.items || [];

        if (dailyItems.length === 0) {
          console.log(`[Tushare] 日期 ${tradeDate} 无交易数据`);
          continue;
        }

        console.log(`[Tushare] 日期 ${tradeDate}: ${dailyItems.length} 条记录`);

        // 逐条写入数据库
        for (const item of dailyItems) {
          const row = {};
          dailyFields.forEach((f, i) => { row[f] = item[i]; });

          const tsCode = row.ts_code;
          const symbol = row.symbol || tsCode.split('.')[0];
          const name = ''; // 日线数据不包含名称
          const volumeInt = row.vol ? Math.round(parseFloat(row.vol)) : null;

          // 检查股票是否存在
          const existingResult = await pool.query(
            'SELECT id FROM stock_pool WHERE symbol = $1 AND deleted = false',
            [symbol]
          );

          if (existingResult.rows.length > 0) {
            // 更新股票池最新行情
            await pool.query(
              `UPDATE stock_pool SET
                 current_price = $1,
                 change_percent = $2,
                 volume = $3,
                 open_price = $4,
                 high_price = $5,
                 low_price = $6,
                 updated_at = CURRENT_TIMESTAMP
               WHERE symbol = $7 AND deleted = false`,
              [
                parseFloat(row.close) || null,
                parseFloat(row.pct_chg) || null,
                volumeInt,
                parseFloat(row.open) || null,
                parseFloat(row.high) || null,
                parseFloat(row.low) || null,
                symbol
              ]
            );
            updatedCount++;
          } else {
            // 新增股票
            await pool.query(
              `INSERT INTO stock_pool (symbol, name, market, current_price, change_percent, volume, open_price, high_price, low_price, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '正常')`,
              [
                symbol,
                name,
                marketCode,
                parseFloat(row.close) || null,
                parseFloat(row.pct_chg) || null,
                volumeInt,
                parseFloat(row.open) || null,
                parseFloat(row.high) || null,
                parseFloat(row.low) || null
              ]
            );
            newCount++;
          }

          // 写入日线历史表
          await pool.query(
            `INSERT INTO stock_daily (symbol, trade_date, open_price, high_price, low_price, close_price, pre_close, change_amount, change_percent, volume, amount)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (symbol, trade_date) DO UPDATE SET
               open_price = EXCLUDED.open_price,
               high_price = EXCLUDED.high_price,
               low_price = EXCLUDED.low_price,
               close_price = EXCLUDED.close_price,
               pre_close = EXCLUDED.pre_close,
               change_amount = EXCLUDED.change_amount,
               change_percent = EXCLUDED.change_percent,
               volume = EXCLUDED.volume,
               amount = EXCLUDED.amount,
               updated_at = NOW()`,
            [
              symbol,
              tradeDate,
              parseFloat(row.open) || null,
              parseFloat(row.high) || null,
              parseFloat(row.low) || null,
              parseFloat(row.close) || null,
              parseFloat(row.pre_close) || null,
              parseFloat(row.change) || null,
              parseFloat(row.pct_chg) || null,
              volumeInt,
              parseFloat(row.amount) || null,
            ]
          );

          totalCount++;
        }

        // 每次请求后延迟，避免频率限制
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`[Tushare] 处理日期 ${tradeDate} 失败:`, err.message);
      }
    }

    // 同步完成后聚合周线和月线
    console.log('[Tushare] 开始聚合周线数据...');
    await pool.query(`
      INSERT INTO stock_weekly (symbol, week_date, open_price, high_price, low_price, close_price, volume, amount)
      SELECT 
        symbol,
        TO_CHAR(DATE_TRUNC('week', trade_date::date), 'YYYY-MM-DD') as week_date,
        (ARRAY_AGG(open_price ORDER BY trade_date ASC))[1] as open_price,
        MAX(high_price) as high_price,
        MIN(low_price) as low_price,
        (ARRAY_AGG(close_price ORDER BY trade_date DESC))[1] as close_price,
        SUM(volume) as volume,
        SUM(amount) as amount
      FROM stock_daily
      GROUP BY symbol, DATE_TRUNC('week', trade_date::date)
      ON CONFLICT (symbol, week_date) DO UPDATE SET
        open_price = EXCLUDED.open_price,
        high_price = EXCLUDED.high_price,
        low_price = EXCLUDED.low_price,
        close_price = EXCLUDED.close_price,
        volume = EXCLUDED.volume,
        amount = EXCLUDED.amount,
        updated_at = NOW()
    `);
    console.log('[Tushare] 周线聚合完成');

    console.log('[Tushare] 开始聚合月线数据...');
    await pool.query(`
      INSERT INTO stock_monthly (symbol, month_date, open_price, high_price, low_price, close_price, volume, amount)
      SELECT 
        symbol,
        LEFT(trade_date, 7) as month_date,
        (ARRAY_AGG(open_price ORDER BY trade_date ASC))[1] as open_price,
        MAX(high_price) as high_price,
        MIN(low_price) as low_price,
        (ARRAY_AGG(close_price ORDER BY trade_date DESC))[1] as close_price,
        SUM(volume) as volume,
        SUM(amount) as amount
      FROM stock_daily
      GROUP BY symbol, LEFT(trade_date, 7)
      ON CONFLICT (symbol, month_date) DO UPDATE SET
        open_price = EXCLUDED.open_price,
        high_price = EXCLUDED.high_price,
        low_price = EXCLUDED.low_price,
        close_price = EXCLUDED.close_price,
        volume = EXCLUDED.volume,
        amount = EXCLUDED.amount,
        updated_at = NOW()
    `);
    console.log('[Tushare] 月线聚合完成');

    return { totalCount, newCount, updatedCount };
  } catch (e) {
    console.error('[Tushare] syncTushareDateRange error:', e.message);
    throw e;
  }
}

// 定时任务：工作日自动同步当日行情数据
async function syncTodayStocks(pool) {
  try {
    console.log('[Scheduler] syncTodayStocks 开始执行');
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const marketCode = 'cn';

    // 依次尝试各数据源，成功一个即返回
    const providers = [
      { name: 'tushare', fetch: fetchTushareStocks },
      { name: 'akshare', fetch: fetchAKShareStocks },
      { name: 'sina', fetch: fetchSinaStocks },
      { name: 'eastmoney', fetch: fetchEastmoneyStocks },
    ];

    let stocks = null;
    let usedProvider = null;

    for (const p of providers) {
      try {
        console.log(`[Scheduler] 尝试从 ${p.name} 获取数据...`);
        stocks = await p.fetch();
        usedProvider = p.name;
        console.log(`[Scheduler] ${p.name} 成功获取 ${stocks.length} 条数据`);
        break;
      } catch (err) {
        console.error(`[Scheduler] ${p.name} 失败:`, err.message);
      }
    }

    if (!stocks || stocks.length === 0) {
      throw new Error('所有数据源均获取失败');
    }

    let newCount = 0;
    let updatedCount = 0;
    let failedCount = 0;

    for (const stock of stocks) {
      try {
        const existingResult = await pool.query(
          'SELECT id FROM stock_pool WHERE symbol = $1 AND deleted = false',
          [stock.symbol]
        );

        const volumeInt = stock.volume ? Math.round(parseFloat(stock.volume)) : null;

        if (existingResult.rows.length > 0) {
          await pool.query(
            `UPDATE stock_pool SET
               current_price = $1, change_percent = $2, volume = $3,
               name = COALESCE($4, name),
               open_price = $5, high_price = $6, low_price = $7,
               updated_at = CURRENT_TIMESTAMP
             WHERE symbol = $8 AND deleted = false`,
            [stock.currentPrice || null, stock.changePercent || null, volumeInt,
             stock.name || null, stock.openPrice || null, stock.highPrice || null,
             stock.lowPrice || null, stock.symbol]
          );
          updatedCount++;
        } else {
          await pool.query(
            `INSERT INTO stock_pool (symbol, name, market, current_price, change_percent, volume, open_price, high_price, low_price, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '正常')`,
            [stock.symbol, stock.name || '', marketCode, stock.currentPrice || null,
             stock.changePercent || null, volumeInt, stock.openPrice || null,
             stock.highPrice || null, stock.lowPrice || null]
          );
          newCount++;
        }

        if (stock.currentPrice !== null || stock.openPrice !== null) {
          await pool.query(
            `INSERT INTO stock_daily (symbol, trade_date, open_price, high_price, low_price, close_price, pre_close, change_amount, change_percent, volume, amount)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (symbol, trade_date) DO UPDATE SET
               open_price = EXCLUDED.open_price, high_price = EXCLUDED.high_price,
               low_price = EXCLUDED.low_price, close_price = EXCLUDED.close_price,
               pre_close = EXCLUDED.pre_close, change_amount = EXCLUDED.change_amount,
               change_percent = EXCLUDED.change_percent, volume = EXCLUDED.volume,
               amount = EXCLUDED.amount, updated_at = NOW()`,
            [stock.symbol, today, stock.openPrice || null, stock.highPrice || null,
             stock.lowPrice || null, stock.currentPrice || null, stock.preClose || null,
             stock.changeAmount || null, stock.changePercent || null, volumeInt, stock.amount || null]
          );
        }
      } catch (err) {
        failedCount++;
        console.error(`[Scheduler] 同步 ${stock.symbol} 失败:`, err.message);
      }
    }

    // 聚合周线和月线
    try {
      await pool.query(`
        INSERT INTO stock_weekly (symbol, week_date, open_price, high_price, low_price, close_price, volume, amount)
        SELECT symbol, TO_CHAR(DATE_TRUNC('week', trade_date::date), 'YYYY-MM-DD'),
          (ARRAY_AGG(open_price ORDER BY trade_date ASC))[1], MAX(high_price), MIN(low_price),
          (ARRAY_AGG(close_price ORDER BY trade_date DESC))[1], SUM(volume), SUM(amount)
        FROM stock_daily
        GROUP BY symbol, DATE_TRUNC('week', trade_date::date)
        ON CONFLICT (symbol, week_date) DO UPDATE SET
          open_price=EXCLUDED.open_price, high_price=EXCLUDED.high_price,
          low_price=EXCLUDED.low_price, close_price=EXCLUDED.close_price,
          volume=EXCLUDED.volume, amount=EXCLUDED.amount, updated_at=NOW()`);

      await pool.query(`
        INSERT INTO stock_monthly (symbol, month_date, open_price, high_price, low_price, close_price, volume, amount)
        SELECT symbol, TO_CHAR(trade_date::date, 'YYYY-MM'),
          (ARRAY_AGG(open_price ORDER BY trade_date ASC))[1], MAX(high_price), MIN(low_price),
          (ARRAY_AGG(close_price ORDER BY trade_date DESC))[1], SUM(volume), SUM(amount)
        FROM stock_daily
        GROUP BY symbol, TO_CHAR(trade_date::date, 'YYYY-MM')
        ON CONFLICT (symbol, month_date) DO UPDATE SET
          open_price=EXCLUDED.open_price, high_price=EXCLUDED.high_price,
          low_price=EXCLUDED.low_price, close_price=EXCLUDED.close_price,
          volume=EXCLUDED.volume, amount=EXCLUDED.amount, updated_at=NOW()`);
    } catch (err) {
      console.error('[Scheduler] 聚合周月线失败:', err.message);
    }

    return { newCount, updatedCount, failedCount, usedProvider };
  } catch (err) {
    console.error('[Scheduler] syncTodayStocks error:', err.message);
    throw err;
  }
}

/**
 * 异步计算所有股票的技术指标（支持进度跟踪和停止）
 */
async function calculateAllStocksIndicatorsAsync(dbPool, options = {}) {
  const { symbols = null, period = 'D', incremental = true } = options;
  const taskId = `indicator_calc_${Date.now()}`;
  
  // 创建任务
  createTask(taskId, { period, incremental });
  
  // 异步执行计算，不阻塞请求
  executeIndicatorCalculation(taskId, dbPool, { symbols, period, incremental }).catch(err => {
    console.error('[Indicators] 任务执行异常:', err);
    failTask(taskId, err.message);
  });
  
  return { taskId };
}

/**
 * 执行指标计算的实际逻辑（增量模式）
 */
async function executeIndicatorCalculation(taskId, dbPool, options = {}) {
  const { symbols = null, period = 'D', incremental = true } = options;
  
  try {
    // 从stock_pool获取所有股票（不限制数据量，因为会从API补充）
    let stocks;
    if (symbols && symbols.length > 0) {
      const placeholders = symbols.map((_, i) => `$${i + 1}`).join(',');
      const result = await dbPool.query(
        `SELECT symbol FROM stock_pool WHERE symbol IN (${placeholders}) AND deleted = false ORDER BY symbol`,
        symbols
      );
      stocks = result.rows;
    } else {
      const result = await dbPool.query(
        `SELECT symbol FROM stock_pool WHERE deleted = false ORDER BY symbol`
      );
      stocks = result.rows;
    }
    
    if (stocks.length === 0) {
      completeTask(taskId, { error: '没有可计算的股票' });
      return;
    }
    
    updateTask(taskId, { total: stocks.length });
    console.log(`[Indicators] [${taskId}] 开始计算 ${stocks.length} 只股票 (周期: ${period}, 增量: ${incremental})`);
    
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let processed = 0;
    
    // 批量处理：每次处理100只股票
    const batchSize = 100;
    
    // 计算增量更新的日期范围
    let calcFromDate = null;
    if (incremental && period === 'D') {
      const today = new Date();
      // 从今天往前推30天（需要历史数据来计算指标）
      calcFromDate = new Date(today);
      calcFromDate.setDate(calcFromDate.getDate() - 30);
    } else if (incremental && period === 'W') {
      // 周线：只计算本周
      const today = new Date();
      const dayOfWeek = today.getDay();
      calcFromDate = new Date(today);
      calcFromDate.setDate(today.getDate() - dayOfWeek);
    } else if (incremental && period === 'M') {
      // 月线：只计算本月
      const today = new Date();
      calcFromDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    for (let i = 0; i < stocks.length; i += batchSize) {
      // 检查是否请求停止
      if (isStopRequested(taskId)) {
        console.log(`[Indicators] [${taskId}] 收到停止请求，终止计算`);
        completeTask(taskId, {
          stopped: true,
          successCount,
          failedCount,
          skippedCount,
          processed,
        });
        return;
      }
      
      const batch = stocks.slice(i, i + batchSize);
      
      // 并行处理当前批次
      const promises = batch.map(async (stock) => {
        try {
          const result = await calculateAndStoreIndicators(
            stock.symbol,
            period,
            200,
            dbPool,
            incremental,
            calcFromDate
          );
          return result;
        } catch (err) {
          return { symbol: stock.symbol, status: 'failed', error: err.message };
        }
      });
      
      const results = await Promise.all(promises);
      
      // 统计结果
      for (const result of results) {
        if (result.status === 'success') successCount++;
        else if (result.status === 'failed') failedCount++;
        else skippedCount++;
      }
      
      processed += batch.length;
      updateTask(taskId, { processed, successCount, failedCount, skippedCount });
      
      // 每批次输出日志
      console.log(`[Indicators] [${taskId}] 进度: ${processed}/${stocks.length} (${Math.round(processed/stocks.length*100)}%)`);
    }
    
    completeTask(taskId, {
      success: true,
      total: stocks.length,
      successCount,
      failedCount,
      skippedCount,
    });
    
    console.log(`[Indicators] [${taskId}] 计算完成: 成功 ${successCount}, 失败 ${failedCount}, 跳过 ${skippedCount}`);
  } catch (err) {
    console.error(`[Indicators] [${taskId}] 批量计算失败:`, err.message);
    failTask(taskId, err.message);
  }
}

/**
 * 为指定股票计算并存储技术指标（支持增量计算）
 */
async function calculateAndStoreIndicators(
  symbol,
  period = 'D',
  limit = 200,
  dbPool = null,
  incremental = false,
  fromDate = null
) {
  try {
    let klineData = null;

    // 优先从本地数据库获取数据
    if (period === 'D' && dbPool) {
      let dateFilter = '';
      const params = [symbol, limit];
      
      if (incremental && fromDate) {
        // 增量模式：只获取最近30天的数据
        const fromStr = fromDate.toISOString().slice(0, 10).replace(/-/g, '');
        dateFilter = `AND trade_date >= '${fromStr}'`;
      }
      
      const result = await dbPool.query(
        `SELECT trade_date as date, open_price as open, high_price as high, low_price as low, close_price as close, volume, amount
         FROM stock_daily
         WHERE symbol = $1
         ${dateFilter}
         ORDER BY trade_date ASC
         LIMIT $2`,
        params
      );
      
      // 对于增量计算，需要获取足够的历史数据来计算指标
      if (result.rows.length > 0) {
        // 获取完整的历史数据（用于计算指标）
        const fullResult = await dbPool.query(
          `SELECT trade_date as date, open_price as open, high_price as high, low_price as low, close_price as close, volume, amount
           FROM stock_daily
           WHERE symbol = $1
           ORDER BY trade_date ASC
           LIMIT 200`,
          [symbol]
        );
        
        if (fullResult.rows.length >= 30) {
          klineData = fullResult.rows.map(row => ({
            date: row.date,
            open: parseFloat(row.open),
            high: parseFloat(row.high),
            low: parseFloat(row.low),
            close: parseFloat(row.close),
            volume: parseFloat(row.volume || 0),
          }));
        }
      }
    }

    // 如果数据库没有数据，则从东方财富获取
    if (!klineData || klineData.length < 30) {
      klineData = await fetchEastmoneyKline(symbol, period, limit);
    }
    
    if (!klineData || klineData.length < 30) {
      return { symbol, status: 'skipped', reason: '数据不足' };
    }
    
    // 计算技术指标
    const indicators = calculateAllIndicators(klineData);
    
    if (indicators.length === 0) {
      return { symbol, status: 'skipped', reason: '计算失败' };
    }
    
    // 增量模式：只保存最近的数据
    let indicatorsToSave = indicators;
    if (incremental && fromDate) {
      const fromStr = fromDate.toISOString().slice(0, 10);
      indicatorsToSave = indicators.filter(ind => ind.date >= fromStr);
    }
    
    if (indicatorsToSave.length === 0) {
      return { symbol, status: 'skipped', reason: '无新增数据' };
    }
    
    // 批量插入数据库
    const values = [];
    const placeholders = [];
    
    indicatorsToSave.forEach((ind, idx) => {
      const dateStr = ind.date.replace(/-/g, '');
      values.push(
        symbol, dateStr, period,
        ind.ma5, ind.ma10, ind.ma20, ind.ma30, ind.ma60,
        ind.bollMid, ind.bollUpper, ind.bollLower,
        ind.macdDif, ind.macdDea, ind.macdHist,
        ind.rsi6, ind.rsi12, ind.rsi24,
        ind.kdjK, ind.kdjD, ind.kdjJ
      );
      placeholders.push(`($${idx * 21 + 1}, $${idx * 21 + 2}, $${idx * 21 + 3}, $${idx * 21 + 4}, $${idx * 21 + 5}, $${idx * 21 + 6}, $${idx * 21 + 7}, $${idx * 21 + 8}, $${idx * 21 + 9}, $${idx * 21 + 10}, $${idx * 21 + 11}, $${idx * 21 + 12}, $${idx * 21 + 13}, $${idx * 21 + 14}, $${idx * 21 + 15}, $${idx * 21 + 16}, $${idx * 21 + 17}, $${idx * 21 + 18}, $${idx * 21 + 19}, $${idx * 21 + 20}, $${idx * 21 + 21})`);
    });
    
    const sql = `
      INSERT INTO stock_indicators 
        (symbol, trade_date, period, ma5, ma10, ma20, ma30, ma60, boll_mid, boll_upper, boll_lower, macd_dif, macd_dea, macd_hist, rsi6, rsi12, rsi24, kdj_k, kdj_d, kdj_j)
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (symbol, trade_date, period) DO UPDATE SET
        ma5=EXCLUDED.ma5, ma10=EXCLUDED.ma10, ma20=EXCLUDED.ma20, ma30=EXCLUDED.ma30, ma60=EXCLUDED.ma60,
        boll_mid=EXCLUDED.boll_mid, boll_upper=EXCLUDED.boll_upper, boll_lower=EXCLUDED.boll_lower,
        macd_dif=EXCLUDED.macd_dif, macd_dea=EXCLUDED.macd_dea, macd_hist=EXCLUDED.macd_hist,
        rsi6=EXCLUDED.rsi6, rsi12=EXCLUDED.rsi12, rsi24=EXCLUDED.rsi24,
        kdj_k=EXCLUDED.kdj_k, kdj_d=EXCLUDED.kdj_d, kdj_j=EXCLUDED.kdj_j,
        updated_at=NOW()
    `;
    
    await pool.query(sql, values);
    
    return { symbol, status: 'success', count: indicatorsToSave.length };
  } catch (err) {
    return { symbol, status: 'failed', error: err.message };
  }
}

/**
 * 异步初始化10年历史K线数据（支持进度跟踪和停止）
 */
async function initHistoricalDataAsync(dbPool, options = {}) {
  const { symbols = null, years = 10, period = 'D' } = options;
  const taskId = `historical_init_${Date.now()}`;
  
  createTask(taskId, { years, period, type: 'historical_init' });
  
  executeHistoricalInit(taskId, dbPool, { symbols, years, period }).catch(err => {
    console.error('[HistoricalData] 任务执行异常:', err);
    failTask(taskId, err.message);
  });
  
  return { taskId };
}

/**
 * 执行历史数据初始化的实际逻辑
 */
async function executeHistoricalInit(taskId, dbPool, options = {}) {
  const { symbols = null, years = 10, period = 'D' } = options;
  
  try {
    // 从stock_pool获取所有股票
    let stocks;
    if (symbols && symbols.length > 0) {
      const placeholders = symbols.map((_, i) => `$${i + 1}`).join(',');
      const result = await dbPool.query(
        `SELECT symbol FROM stock_pool WHERE symbol IN (${placeholders}) AND deleted = false ORDER BY symbol`,
        symbols
      );
      stocks = result.rows;
    } else {
      const result = await dbPool.query(
        `SELECT symbol FROM stock_pool WHERE deleted = false ORDER BY symbol`
      );
      stocks = result.rows;
    }
    
    if (stocks.length === 0) {
      completeTask(taskId, { error: '没有可处理的股票' });
      return;
    }
    
    updateTask(taskId, { total: stocks.length });
    console.log(`[HistoricalData] [${taskId}] 开始初始化 ${stocks.length} 只股票的 ${years} 年历史数据 (周期: ${period})`);
    
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let processed = 0;
    
    // 10年约2440个交易日
    const limit = years * 244;
    const batchSize = 50; // 每批50只，避免API过载
    
    for (let i = 0; i < stocks.length; i += batchSize) {
      // 检查是否请求停止
      if (isStopRequested(taskId)) {
        console.log(`[HistoricalData] [${taskId}] 收到停止请求，终止初始化`);
        completeTask(taskId, {
          stopped: true,
          successCount,
          failedCount,
          skippedCount,
          processed,
        });
        return;
      }
      
      const batch = stocks.slice(i, i + batchSize);
      
      const promises = batch.map(async (stock) => {
        try {
          const result = await fetchAndStoreKlineData(
            stock.symbol,
            period,
            limit,
            dbPool
          );
          return result;
        } catch (err) {
          return { symbol: stock.symbol, status: 'failed', error: err.message };
        }
      });
      
      const results = await Promise.all(promises);
      
      for (const result of results) {
        if (result.status === 'success') successCount++;
        else if (result.status === 'failed') failedCount++;
        else skippedCount++;
      }
      
      processed += batch.length;
      updateTask(taskId, { processed, successCount, failedCount, skippedCount });
      console.log(`[HistoricalData] [${taskId}] 进度: ${processed}/${stocks.length} (${Math.round(processed/stocks.length*100)}%)`);
      
      // 每批次后暂停500ms，避免API限流
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    completeTask(taskId, {
      success: true,
      total: stocks.length,
      successCount,
      failedCount,
      skippedCount,
    });
    
    console.log(`[HistoricalData] [${taskId}] 初始化完成: 成功 ${successCount}, 失败 ${failedCount}, 跳过 ${skippedCount}`);
  } catch (err) {
    console.error(`[HistoricalData] [${taskId}] 批量初始化失败:`, err.message);
    failTask(taskId, err.message);
  }
}

/**
 * 获取并存储K线历史数据
 */
async function fetchAndStoreKlineData(symbol, period = 'D', limit = 2440, dbPool = null) {
  try {
    // 从东方财富API获取历史数据
    const klineData = await fetchEastmoneyKline(symbol, period, limit);
    
    if (!klineData || klineData.length === 0) {
      return { symbol, status: 'skipped', reason: '无数据' };
    }
    
    // 检查是否已有数据
    const existingResult = await dbPool.query(
      `SELECT COUNT(*) as count FROM stock_daily WHERE symbol = $1`,
      [symbol]
    );
    const existingCount = parseInt(existingResult.rows[0].count);
    
    // 如果已有数据且数量接近，跳过
    if (existingCount >= klineData.length * 0.9) {
      return { symbol, status: 'skipped', reason: '数据已存在' };
    }
    
    // 批量插入/更新数据
    const values = [];
    const placeholders = [];
    
    klineData.forEach((item, idx) => {
      const dateStr = item.date.replace(/-/g, '');
      values.push(
        symbol, dateStr,
        item.open, item.high, item.low, item.close,
        item.volume, item.amount
      );
      placeholders.push(`($${idx * 7 + 1}, $${idx * 7 + 2}, $${idx * 7 + 3}, $${idx * 7 + 4}, $${idx * 7 + 5}, $${idx * 7 + 6}, $${idx * 7 + 7})`);
    });
    
    const sql = `
      INSERT INTO stock_daily 
        (symbol, trade_date, open_price, high_price, low_price, close_price, volume, amount)
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (symbol, trade_date) DO UPDATE SET
        open_price=EXCLUDED.open_price,
        high_price=EXCLUDED.high_price,
        low_price=EXCLUDED.low_price,
        close_price=EXCLUDED.close_price,
        volume=EXCLUDED.volume,
        amount=EXCLUDED.amount,
        updated_at=NOW()
    `;
    
    await dbPool.query(sql, values);
    
    return { symbol, status: 'success', count: klineData.length };
  } catch (err) {
    return { symbol, status: 'failed', error: err.message };
  }
}

module.exports = {
  MARKET_PROVIDERS,
  getProvider,
  fetchTushareStocks,
  fetchTushareKline,
  fetchAKShareStocks,
  fetchAKShareKline,
  fetchSinaStocks,
  fetchSinaKline,
  fetchEastmoneyStocks,
  fetchEastmoneyKline,
  fetchYahooStocks,
  fetchYahooKline,
  fetchPolygonStocks,
  fetchPolygonKline,
  fetchLongportStocks,
  fetchLongportKline,
  syncTushareDateRange,
  syncTodayStocks,
  calculateAndStoreIndicators,
  calculateAllStocksIndicatorsAsync,
  executeIndicatorCalculation,
  initHistoricalDataAsync,
};
