/**
 * 行情中心数据服务
 * 统一的股票数据获取服务，优先从数据库获取各API平台的数据
 */
import apiClient from './apiClient.js'

class MarketDataService {
  constructor() {
    this.baseURL = window.location.origin
    this.useDatabase = true // 优先使用数据库
  }

  /**
   * 获取股票实时数据（优先数据库，备用实时API）
   */
  async getRealtimeQuotes(symbols = []) {
    try {
      // 优先从数据库获取统一存储的数据
      if (this.useDatabase) {
        const dbData = await this.getStocksFromDatabase(symbols)
        if (dbData && dbData.length > 0) {
          console.log(`√ 从数据库获取${dbData.length}只股票数据`)
          return this.formatForMarketDisplay(dbData)
        } else {
          console.log('📡 数据库无有效数据，尝试使用实时API获取数据')
        }
      }

      // 数据库无数据或关闭数据库模式，使用实时API作为备用
      const qmtApiService = await import('../utils/qmtStockApi.js')
      const realtimeData = await qmtApiService.getMultipleStocksRealtime(symbols)
      console.log(`📡 实时API获取${realtimeData.length}只股票数据`)
      return realtimeData
      
    } catch (error) {
      console.error('获取股票数据失败，返回空数组:', error)
      // 确保始终返回数组，避免undefined
      return []
    }
  }

  /**
   * 从数据库获取股票数据
   */
  async getStocksFromDatabase(symbols = []) {
    try {
      const params = {}
      if (symbols.length > 0) {
        params.symbols = symbols.join(',')
      }

      const response = await apiClient.get('/api/market-quotes/realtime', params)
      console.log('📊 后端API响应:', response)
      
      // 后端返回的数据结构: {success: true, data: [...], count: ...}
      if (response.data && response.data.success === true && Array.isArray(response.data.data)) {
        const filteredData = response.data.data.filter(stock => 
          stock.symbol && stock.current_price !== null
        )
        console.log(`✅ 从数据库成功获取${filteredData.length}只有效股票数据`)
        return filteredData
      } else {
        console.warn('后端API响应格式不正确或数据为空:', response.data)
        return []
      }
      
    } catch (error) {
      console.warn('从数据库获取数据失败，将使用实时API:', error.message)
      return []
    }
  }

  /**
   * 获取最新更新的股票数据
   */
  async getLatestUpdatedStocks(limit = 100) {
    try {
      const response = await apiClient.get('/api/market-quotes/realtime', {
        limit,
        order_by: 'timestamp',
        order: 'desc'
      })
      
      return this.formatForMarketDisplay(response.data || [])
    } catch (error) {
      console.error('获取最新更新股票失败:', error)
      return []
    }
  }

  /**
   * 搜索股票
   */
  async searchStocks(keyword) {
    try {
      // 优先数据库搜索
      const dbResults = await this.searchInDatabase(keyword)
      if (dbResults.length > 0) {
        return dbResults
      }

      // 数据库无结果，使用API搜索
      const qmtApiService = await import('../utils/qmtStockApi.js')
      return await qmtApiService.searchStock(keyword)
      
    } catch (error) {
      console.error('搜索股票失败:', error)
      return []
    }
  }

  /**
   * 在数据库中搜索股票
   */
  async searchInDatabase(keyword) {
    try {
      const response = await apiClient.get('/api/market-quotes/realtime', {
        search: keyword
      })
      
      return this.formatForMarketDisplay(response.data || [])
    } catch (error) {
      console.warn('数据库搜索失败:', error.message)
      return []
    }
  }

  /**
   * 格式化数据库数据为行情中心显示格式
   */
  formatForMarketDisplay(dbStocks) {
    return dbStocks.map(stock => ({
      symbol: stock.symbol,
      name: stock.name || stock.symbol,
      sector: stock.sector || '通用',
      totalMarketCap: this.formatMarketCap(stock.total_market_cap),
      circulatingMarketCap: this.formatMarketCap(stock.circulating_market_cap),
      changePercent: stock.change_percent ? parseFloat(stock.change_percent) : 0,
      currentPrice: stock.current_price ? parseFloat(stock.current_price) : 0,
      highPrice: stock.high_price ? parseFloat(stock.high_price) : 0,
      lowPrice: stock.low_price ? parseFloat(stock.low_price) : 0,
      volume: stock.volume ? parseInt(stock.volume) : 0,
      updatedAt: stock.timestamp 
        ? new Date(stock.timestamp).toLocaleString('zh-CN')
        : new Date().toLocaleString('zh-CN'),
      openPrice: stock.open_price ? parseFloat(stock.open_price) : 0,
      prevClose: stock.prev_close ? parseFloat(stock.prev_close) : 0,
      dataSource: stock.data_source || 'database'
    }))
  }

  /**
   * 格式化市值显示
   */
  formatMarketCap(value) {
    if (!value) return '--'
    
    const numValue = parseFloat(value)
    if (numValue === 0) return '--'
    
    if (numValue >= 1e12) {
      return (numValue / 1e12).toFixed(2) + '万亿'
    } else if (numValue >= 1e8) {
      return (numValue / 1e8).toFixed(2) + '亿'
    } else if (numValue >= 1e4) {
      return (numValue / 1e4).toFixed(2) + '万'
    } else {
      return numValue.toFixed(2)
    }
  }

  /**
   * 检查数据更新状态
   */
  async checkDataStatus() {
    try {
      // 尝试从数据库获取少量数据来测试连接
      const testData = await this.getStocksFromDatabase(['000001', '600036'])
      
      // 如果没有后端服务器，则从localStorage检查状态
      let dataStatus = {
        databaseStatus: testData.length > 0 ? 'connected' : 'disconnected',
        totalStocks: testData.length,
        lastUpdated: testData.length > 0 ? new Date() : null,
        dataSources: [],
        latestSource: 'database'
      }
      
      // 从localStorage获取更多统计信息
      try {
        const storageStatus = localStorage.getItem('market_data_status')
        if (storageStatus) {
          const parsed = JSON.parse(storageStatus)
          dataStatus = { ...dataStatus, ...parsed }
        }
      } catch (storageError) {
        console.log('无法读取localStorage状态:', storageError)
      }
      
      return dataStatus
      
    } catch (error) {
      return {
        databaseStatus: 'disconnected',
        error: error.message,
        totalStocks: 0,
        dataSources: []
      }
    }
  }

  /**
   * 获取数据统计信息
   */
  async getStatistics() {
    try {
      const stocks = await this.getStocksFromDatabase()
      
      return {
        totalCount: stocks.length,
        upCount: stocks.filter(s => s.change_percent > 0).length,
        downCount: stocks.filter(s => s.change_percent < 0).length,
        flatCount: stocks.filter(s => s.change_percent === 0).length,
        sources: this.countDataSources(stocks),
        lastUpdate: stocks.length > 0 
          ? new Date(Math.max(...stocks.map(s => new Date(s.timestamp).getTime())))
          : '暂无数据'
      }
    } catch (error) {
      console.error('获取统计信息失败:', error)
      return { totalCount: 0, upCount: 0, downCount: 0, flatCount: 0, sources: [] }
    }
  }

  /**
   * 统计数据来源分布
   */
  countDataSources(stocks) {
    const sourceCounts = {}
    stocks.forEach(stock => {
      const source = stock.data_source || 'unknown'
      sourceCounts[source] = (sourceCounts[source] || 0) + 1
    })
    return sourceCounts
  }

  /**
   * 启用/禁用数据库优先模式
   */
  setUseDatabase(enabled) {
    this.useDatabase = enabled
    console.log(`数据库优先模式: ${enabled ? '启用' : '禁用'}`)
  }

  /**
   * 清除缓存数据
   */
  clearCache() {
    console.log('MarketDataService缓存已清除')
  }
}

// 创建单例实例
export default new MarketDataService()