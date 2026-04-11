/**
 * 股票数据API工具
 * 使用新浪财经免费API获取A股数据
 */

const BASE_URL = 'http://hq.sinajs.cn'
const HISTORY_BASE_URL = 'https://finance.sina.com.cn/realstock/company'

/**
 * 获取股票实时行情
 * @param {string} symbol - 股票代码（如：000001, 600000）
 * @returns {Object} 股票实时数据
 */
export const getStockRealtime = async (symbol) => {
  try {
    // 格式化股票代码
    const formattedSymbol = formatSinaSymbol(symbol)
    
    // 使用代理API避免跨域和中文编码问题
    const proxyUrl = `http://localhost:3001/api/proxy/sina-realtime?symbol=${formattedSymbol}`
    
    try {
      const response = await fetch(proxyUrl)
      if (response.ok) {
        const data = await response.json()
        return data
      }
    } catch (proxyError) {
      console.warn('代理API不可用，使用模拟数据', proxyError)
    }

    // 代理不可用时返回模拟数据
    return getMockRealtimeData(symbol)
  } catch (error) {
    console.error('获取股票实时数据失败:', error)
    return getMockRealtimeData(symbol)
  }
}

/**
 * 获取多只股票实时行情
 * @param {Array} symbols - 股票代码数组
 * @returns {Array} 股票实时数据数组
 */
export const getMultipleStocksRealtime = async (symbols) => {
  try {
    // 使用代理API批量获取数据
    const proxyUrl = `http://localhost:3001/api/proxy/sina-batch-realtime?symbols=${symbols.join(',')}`
    
    try {
      const response = await fetch(proxyUrl)
      if (response.ok) {
        const data = await response.json()
        return data
      }
    } catch (proxyError) {
      console.warn('代理API不可用，使用模拟数据', proxyError)
    }

    // 代理不可用时返回模拟数据
    return symbols.map(symbol => getMockRealtimeData(symbol))
  } catch (error) {
    console.error('获取多只股票实时数据失败:', error)
    return symbols.map(symbol => getMockRealtimeData(symbol))
  }
}

/**
 * 获取股票历史K线数据
 * @param {string} symbol - 股票代码
 * @param {string} period - 周期：daily(日线), weekly(周线), monthly(月线)
 * @param {number} count - 获取条数
 * @returns {Array} K线数据
 */
export const getStockKline = async (symbol, period = 'daily', count = 200) => {
  try {
    // 使用东方财富的K线接口（JSONP方式，需要处理跨域）
    const formattedSymbol = formatEastMoneySymbol(symbol)
    const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${formattedSymbol}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=${getPeriodCode(period)}&fqt=1&end=20500101&lmt=${count}`

    const response = await fetch(url)
    const data = await response.json()

    if (data && data.data && data.data.klines) {
      return parseKlineData(data.data.klines, symbol)
    }

    return getMockKlineData(symbol, count)
  } catch (error) {
    console.error('获取K线数据失败:', error)
    return getMockKlineData(symbol, count)
  }
}

/**
 * 格式化新浪股票代码
 * @param {string} symbol - 股票代码
 * @returns {string} 新浪格式的股票代码
 */
const formatSinaSymbol = (symbol) => {
  if (symbol.startsWith('6')) {
    return `sh${symbol}`
  } else if (symbol.startsWith('0') || symbol.startsWith('3')) {
    return `sz${symbol}`
  }
  return symbol
}

/**
 * 格式化东方财富股票代码
 * @param {string} symbol - 股票代码
 * @returns {string} 东方财富格式的股票代码
 */
const formatEastMoneySymbol = (symbol) => {
  if (symbol.startsWith('6')) {
    return `1.${symbol}`
  } else if (symbol.startsWith('0') || symbol.startsWith('3')) {
    return `0.${symbol}`
  }
  return symbol
}

/**
 * 获取周期代码
 * @param {string} period - 周期
 * @returns {number} 周期代码
 */
const getPeriodCode = (period) => {
  const periodMap = {
    'daily': 101,
    'weekly': 102,
    'monthly': 103
  }
  return periodMap[period] || 101
}

/**
 * 解析K线数据
 * @param {Array} klines - K线原始数据
 * @param {string} symbol - 股票代码
 * @returns {Array} 解析后的K线数据
 */
const parseKlineData = (klines, symbol) => {
  return klines.map(kline => {
    const [date, open, close, high, low, volume, amount] = kline.split(',')
    return {
      timestamp: new Date(date).getTime(),
      date: date,
      open: parseFloat(open),
      close: parseFloat(close),
      high: parseFloat(high),
      low: parseFloat(low),
      volume: parseInt(volume),
      amount: parseFloat(amount)
    }
  })
}

/**
 * 获取模拟的实时数据（用于演示）
 * @param {string} symbol - 股票代码
 * @returns {Object} 模拟数据
 */
const getMockRealtimeData = (symbol) => {
  const basePrice = 10 + Math.random() * 90
  const changePercent = (Math.random() - 0.5) * 10

  return {
    symbol: symbol,
    name: getStockName(symbol),
    currentPrice: parseFloat(basePrice.toFixed(2)),
    openPrice: parseFloat((basePrice * (1 - changePercent / 100 * 0.5)).toFixed(2)),
    highPrice: parseFloat((basePrice * (1 + Math.abs(changePercent) / 100 * 0.5)).toFixed(2)),
    lowPrice: parseFloat((basePrice * (1 - Math.abs(changePercent) / 100 * 0.5)).toFixed(2)),
    prevClose: parseFloat((basePrice / (1 + changePercent / 100)).toFixed(2)),
    change: parseFloat((basePrice * changePercent / 100).toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    volume: Math.floor(Math.random() * 100000000),
    amount: Math.floor(Math.random() * 1000000000),
    time: new Date().toISOString()
  }
}

/**
 * 获取模拟的K线数据（用于演示）
 * @param {string} symbol - 股票代码
 * @param {number} count - 数据条数
 * @returns {Array} K线数据
 */
const getMockKlineData = (symbol, count = 200) => {
  const klines = []
  const basePrice = 10 + Math.random() * 90
  let currentPrice = basePrice
  const now = new Date()

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // 跳过周末
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue
    }

    const open = currentPrice * (1 + (Math.random() - 0.5) * 0.02)
    const close = open * (1 + (Math.random() - 0.5) * 0.04)
    const high = Math.max(open, close) * (1 + Math.random() * 0.02)
    const low = Math.min(open, close) * (1 - Math.random() * 0.02)
    const volume = Math.floor(Math.random() * 100000000)

    klines.push({
      timestamp: date.getTime(),
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      volume: volume,
      amount: volume * ((open + close) / 2)
    })

    currentPrice = close
  }

  return klines
}

/**
 * 解析新浪财经搜索建议数据
 * @param {string} data - 新浪财经返回的原始数据
 * @returns {Array} 解析后的股票列表
 */
const parseSinaSuggestData = (data) => {
  try {
    // 新浪财经返回的数据格式：var suggestdata="000001~平安银行~0.000~0.000~0.000~0.000~000001|000002~万科A~0.000~0.000~0.000~0.000~000002"
    const match = data.match(/var\s+suggestdata\s*=\s*"([^"]+)"/)
    if (!match || !match[1]) {
      return []
    }
    
    const items = match[1].split('|')
    const stocks = []
    
    items.forEach(item => {
      const parts = item.split('~')
      if (parts.length >= 2) {
        const symbol = parts[0]
        const name = parts[1]
        const market = symbol.startsWith('6') ? 'sh' : symbol.startsWith('0') || symbol.startsWith('3') ? 'sz' : ''
        const exchange = market === 'sh' ? '上交所' : market === 'sz' ? '深交所' : ''
        
        stocks.push({
          symbol: symbol,
          name: name,
          market: market,
          exchange: exchange,
          sector: getSectorBySymbol(symbol)
        })
      }
    })
    
    return stocks
  } catch (error) {
    console.error('解析新浪搜索数据失败:', error)
    return []
  }
}

/**
 * 根据股票代码获取行业分类（简单实现）
 * @param {string} symbol - 股票代码
 * @returns {string} 行业名称
 */
const getSectorBySymbol = (symbol) => {
  const sectorMap = {
    '000001': '银行', '600000': '银行', '600036': '银行', '601398': '银行', '601988': '银行',
    '000002': '房地产', '000671': '房地产', '600048': '房地产',
    '000333': '家电', '000651': '家电',
    '600519': '白酒', '000858': '白酒',
    '601318': '保险', '601601': '保险',
    '600030': '证券', '600837': '证券',
    '002594': '汽车', '600104': '汽车',
    '300750': '电池', '600884': '电池',
    '000063': '通讯', '600050': '通讯',
    '601857': '能源', '600028': '能源',
    '600900': '电力', '601991': '电力'
  }
  return sectorMap[symbol] || '其他'
}

/**
 * 获取股票名称（模拟数据）
 * @param {string} symbol - 股票代码
 * @returns {string} 股票名称
 */
const getStockName = (symbol) => {
  const stockNames = {
    '000001': '平安银行',
    '000002': '万科A',
    '000063': '中兴通讯',
    '000333': '美的集团',
    '000651': '格力电器',
    '000725': '京东方A',
    '000858': '五粮液',
    '600000': '浦发银行',
    '600036': '招商银行',
    '600519': '贵州茅台',
    '600900': '长江电力',
    '601318': '中国平安',
    '601398': '工商银行',
    '601857': '中国石油',
    '601988': '中国银行',
    '603259': '药明康德',
    '002594': '比亚迪',
    '300750': '宁德时代',
    '600030': '中信证券'
  }
  return stockNames[symbol] || `股票${symbol}`
}

/**
 * 批量更新股票池数据
 * @param {Array} symbols - 股票代码数组
 * @returns {Array} 更新后的股票数据
 */
export const batchUpdateStockData = async (symbols) => {
  try {
    const realtimeData = await getMultipleStocksRealtime(symbols)
    return realtimeData
  } catch (error) {
    console.error('批量更新股票数据失败:', error)
    return []
  }
}

/**
 * 搜索股票
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 搜索结果
 */
export const searchStock = async (keyword) => {
  try {
    // 新浪财经的搜索接口 (GBK编码)
    // 需要后端代理处理中文编码，前端直接请求会出现乱码
    const url = `http://suggest3.sinajs.cn/suggest/type=11,12&key=${encodeURIComponent(keyword)}&name=suggestdata`
    
    // 使用代理API避免跨域和编码问题
    const proxyUrl = `http://localhost:3001/api/proxy/sina-suggest?key=${encodeURIComponent(keyword)}`
    
    try {
      const response = await fetch(proxyUrl)
      if (response.ok) {
        const data = await response.text()
        return parseSinaSuggestData(data)
      }
    } catch (proxyError) {
      console.warn('代理API不可用，使用模拟数据', proxyError)
    }

    // 代理不可用时返回模拟数据
    return getMockSearchResult(keyword)
  } catch (error) {
    console.error('搜索股票失败:', error)
    return getMockSearchResult(keyword)
  }
}

/**
 * 获取模拟的搜索结果
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 搜索结果
 */
const getMockSearchResult = (keyword) => {
  const stocks = [
    { symbol: '000001', name: '平安银行', market: 'sz', exchange: '深交所', sector: '银行' },
    { symbol: '000002', name: '万科A', market: 'sz', exchange: '深交所', sector: '房地产' },
    { symbol: '000333', name: '美的集团', market: 'sz', exchange: '深交所', sector: '家电' },
    { symbol: '000651', name: '格力电器', market: 'sz', exchange: '深交所', sector: '家电' },
    { symbol: '600000', name: '浦发银行', market: 'sh', exchange: '上交所', sector: '银行' },
    { symbol: '600036', name: '招商银行', market: 'sh', exchange: '上交所', sector: '银行' },
    { symbol: '600519', name: '贵州茅台', market: 'sh', exchange: '上交所', sector: '白酒' },
    { symbol: '600030', name: '中信证券', market: 'sh', exchange: '上交所', sector: '证券' },
    { symbol: '601318', name: '中国平安', market: 'sh', exchange: '上交所', sector: '保险' },
    { symbol: '002594', name: '比亚迪', market: 'sz', exchange: '深交所', sector: '汽车' },
    { symbol: '300750', name: '宁德时代', market: 'sz', exchange: '深交所', sector: '电池' }
  ]

  if (!keyword) return stocks

  const lowerKeyword = keyword.toLowerCase()
  return stocks.filter(stock =>
    stock.symbol.includes(lowerKeyword) ||
    stock.name.includes(keyword)
  )
}
