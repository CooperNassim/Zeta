/**
 * 统一数据存储服务
 * 负责将各API平台的股票数据标准化后存储到数据库
 */
import apiClient from './apiClient' // 假设存在统一的API客户端

class DataStorageService {
  constructor() {
    this.baseURL = window.location.origin
  }

  /**
   * 标准化股票数据格式
   * 将不同API的数据转换为统一的格式
   */
  normalizeStockData(rawData, apiSource, symbol) {
    const now = new Date()
    
    // 根据API来源进行不同的数据标准化
    switch (apiSource) {
      case 'itick':
        return this.normalizeITickData(rawData, symbol, now)
      case 'tushare':
        return this.normalizeTushareData(rawData, symbol, now)
      case 'akshare':
        return this.normalizeAKShareData(rawData, symbol, now)
      default:
        return this.normalizeDefaultData(rawData, symbol, now)
    }
  }

  /**
   * 标准化iTick API数据
   */
  normalizeITickData(rawData, symbol, timestamp) {
    // 处理历史K线数据
    if (Array.isArray(rawData)) {
      return rawData.map(item => ({
        symbol: item.code || symbol,
        name: item.name || symbol,
        current_price: item.close ? parseFloat(item.close) : null,
        prev_close: item.pre_close ? parseFloat(item.pre_close) : null,
        open_price: item.open ? parseFloat(item.open) : null,
        high_price: item.high ? parseFloat(item.high) : null,
        low_price: item.low ? parseFloat(item.low) : null,
        volume: item.vol ? parseInt(item.vol) : null,
        market: this.getMarketFromSymbol(symbol),
        timestamp: item.date ? new Date(item.date) : timestamp,
        data_source: 'itick',
        change_percent: item.pct_chg ? parseFloat(item.pct_chg) : 
                      (item.close && item.pre_close) ? 
                      ((parseFloat(item.close) - parseFloat(item.pre_close)) / parseFloat(item.pre_close) * 100) : 0
      }))
    }

    // 处理实时行情数据
    return {
      symbol: rawData.code || symbol,
      name: rawData.name || symbol,
      current_price: rawData.current ? parseFloat(rawData.current) : null,
      prev_close: rawData.last_close ? parseFloat(rawData.last_close) : null,
      open_price: rawData.open ? parseFloat(rawData.open) : null,
      high_price: rawData.high ? parseFloat(rawData.high) : null,
      low_price: rawData.low ? parseFloat(rawData.low) : null,
      volume: rawData.volume ? parseInt(rawData.volume) : null,
      market: this.getMarketFromSymbol(symbol),
      timestamp: timestamp,
      data_source: 'itick',
      change_percent: rawData.pct_chg ? parseFloat(rawData.pct_chg) :
                    (rawData.current && rawData.last_close) ?
                    ((parseFloat(rawData.current) - parseFloat(rawData.last_close)) / parseFloat(rawData.last_close) * 100) : 0
    }
  }

  /**
   * 标准化Tushare数据
   */
  normalizeTushareData(rawData, symbol, timestamp) {
    return {
      symbol: symbol,
      name: rawData.name || symbol,
      current_price: rawData.close ? parseFloat(rawData.close) : null,
      prev_close: rawData.pre_close ? parseFloat(rawData.pre_close) : null,
      open_price: rawData.open ? parseFloat(rawData.open) : null,
      high_price: rawData.high ? parseFloat(rawData.high) : null,
      low_price: rawData.low ? parseFloat(rawData.low) : null,
      volume: rawData.vol ? parseInt(rawData.vol) : null,
      market: this.getMarketFromSymbol(symbol),
      timestamp: rawData.trade_date ? new Date(rawData.trade_date) : timestamp,
      data_source: 'tushare'
    }
  }

  /**
   * 标准化AKShare数据
   */
  normalizeAKShareData(rawData, symbol, timestamp) {
    return {
      symbol: symbol,
      name: rawData.name || symbol,
      current_price: rawData.close ? parseFloat(rawData.close) : null,
      prev_close: rawData.pre_close ? parseFloat(rawData.pre_close) : null,
      open_price: rawData.open ? parseFloat(rawData.open) : null,
      high_price: rawData.high ? parseFloat(rawData.high) : null,
      low_price: rawData.low ? parseFloat(rawData.low) : null,
      volume: rawData.volume ? parseInt(rawData.volume) : null,
      market: this.getMarketFromSymbol(symbol),
      timestamp: timestamp,
      data_source: 'akshare'
    }
  }

  /**
   * 默认数据标准化
   */
  normalizeDefaultData(rawData, symbol, timestamp) {
    return {
      symbol: symbol,
      name: symbol,
      current_price: rawData.price || null,
      prev_close: rawData.prev_close || null,
      open_price: rawData.open || null,
      high_price: rawData.high || null,
      low_price: rawData.low || null,
      volume: rawData.volume || null,
      market: this.getMarketFromSymbol(symbol),
      timestamp: timestamp,
      data_source: 'default'
    }
  }

  /**
   * 根据股票代码识别市场
   */
  getMarketFromSymbol(symbol) {
    if (symbol.startsWith('6') || symbol.startsWith('SH')) {
      return 'sh'
    } else if (symbol.startsWith('0') || symbol.startsWith('3') || symbol.startsWith('SZ')) {
      return 'sz'
    } else {
      return 'other'
    }
  }

  /**
   * 存储股票数据到数据库
   */
  async storeStockData(normalizedData, apiSource) {
    try {
      const dataArray = Array.isArray(normalizedData) ? normalizedData : [normalizedData]
      
      // 确保数据有效
      const validData = dataArray.filter(item => 
        item.symbol && item.current_price !== null
      )

      if (validData.length === 0) {
        console.warn('没有有效的数据需要存储')
        return { success: 0, failed: 0 }
      }

      const response = await apiClient.post('/api/market-quotes/realtime/update', {
        stocks: validData
      })

      return response.data || { success: validData.length, failed: 0 }
    } catch (error) {
      console.error(`存储股票数据失败 (${apiSource}):`, error)
      throw new Error(`数据存储失败: ${error.message}`)
    }
  }

  /**
   * 批量存储多个股票数据
   */
  async storeBatchStockData(stocksData, apiSource) {
    const results = {
      total: stocksData.length,
      success: 0,
      failed: 0,
      errors: []
    }

    for (const stockData of stocksData) {
      try {
        await this.storeStockData(stockData, apiSource)
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({
          symbol: stockData.symbol || 'unknown',
          error: error.message
        })
      }
    }

    return results
  }

  /**
   * 从数据库获取股票数据
   */
  async getStockData(symbols = [], filters = {}) {
    try {
      const params = new URLSearchParams()
      
      if (symbols.length > 0) {
        params.append('symbols', symbols.join(','))
      }
      
      if (filters.market) {
        params.append('market', filters.market)
      }
      
      if (filters.dataSource) {
        params.append('data_source', filters.dataSource)
      }

      const response = await apiClient.get(`/api/market-quotes/realtime?${params}`)
      return response.data
    } catch (error) {
      console.error('获取股票数据失败:', error)
      throw new Error(`获取数据失败: ${error.message}`)
    }
  }

  /**
   * 检查数据存储状态
   */
  async checkDataStatus(symbols) {
    try {
      const data = await this.getStockData(symbols)
      return {
        totalSymbols: symbols.length,
        storedSymbols: data.length,
        missingSymbols: symbols.filter(symbol => 
          !data.find(item => item.symbol === symbol)
        ),
        lastUpdated: data.length > 0 ? Math.max(...data.map(item => 
          new Date(item.timestamp).getTime()
        )) : null
      }
    } catch (error) {
      console.error('检查数据状态失败:', error)
      return { error: error.message }
    }
  }
}

// 创建单例实例
export default new DataStorageService()