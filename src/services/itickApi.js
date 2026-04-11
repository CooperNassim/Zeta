import axios from 'axios'
import dataStorageService from './dataStorageService.js'

// iTick API 配置 - 使用后端代理避免CORS错误
const ITICK_CONFIG = {
  BASE_URL: 'http://localhost:3001/api/proxy/itick',  // 后端代理地址
  TOKEN: '225630767e444bf389d3eae2842097c9c4195c5ed3de4a41adb0d82a3a9e97b2',
  RATE_LIMIT: 5, // 每分钟5次调用
  BATCH_SIZE: 10,
  SAVE_TO_DB: true // 是否保存到数据库
}

// 频率控制类
class RateLimiter {
  constructor(maxCallsPerMinute = 5) {
    this.maxCalls = maxCallsPerMinute
    this.callTimestamps = []
  }

  async waitIfNeeded() {
    const now = Date.now() / 1000 // 转换为秒
    
    // 移除1分钟前的记录
    this.callTimestamps = this.callTimestamps.filter(
      ts => now - ts < 60
    )
    
    // 如果达到限制，等待
    if (this.callTimestamps.length >= this.maxCalls) {
      const oldestCall = this.callTimestamps[0]
      const waitTime = 60 - (now - oldestCall) + 0.1
      
      if (waitTime > 0) {
        console.log(`频率限制：等待${waitTime.toFixed(1)}秒`)
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
      }
    }
    
    // 记录本次调用
    this.callTimestamps.push(now)
  }

  async callWithRateLimit(apiCall, ...args) {
    await this.waitIfNeeded()
    return await apiCall(...args)
  }
}

// 全局频率控制器
const rateLimiter = new RateLimiter(ITICK_CONFIG.RATE_LIMIT)

// iTick API服务类
class ITickApiService {
  constructor() {
    this.token = ITICK_CONFIG.TOKEN
    this.baseUrl = ITICK_CONFIG.BASE_URL
  }

  // 构建请求头
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'token': this.token
    }
  }

  // 安全API调用
  async safeApiCall(endpoint, params = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        params,
        timeout: 10000 // 10秒超时
      })

      if (response.status === 429) {
        throw new Error('API频率限制')
      } else if (response.status === 403) {
        throw new Error('API Token无效或过期')
      } else if (response.status !== 200) {
        throw new Error(`API错误: ${response.status}`)
      }

      const data = response.data
      
      // 检查业务状态码
      if (data.code !== 0) {
        throw new Error(`iTick API错误: ${data.msg || '未知错误'}`)
      }

      return data.data || data
      
    } catch (error) {
      if (error.response) {
        throw new Error(`iTick API错误: ${error.response.status} - ${error.response.data}`)
      } else if (error.request) {
        throw new Error('网络连接错误，请检查网络连接')
      } else {
        throw new Error(`请求失败: ${error.message}`)
      }
    }
  }

  // 获取K线数据
  async getKlineData(symbol, kType = 6, limit = 200, endTime = null) {
    const region = this.getRegionCode(symbol)
    const code = this.cleanSymbol(symbol)
    
    const params = {
      region,
      code,
      kType,
      limit
    }

    if (endTime) {
      params.et = endTime
    }

    const result = await rateLimiter.callWithRateLimit(
      () => this.safeApiCall('/stock/kline', params)
    )

    // 如果启用了数据库保存，保存数据
    if (ITICK_CONFIG.SAVE_TO_DB && result) {
      try {
        await dataStorageService.storeStockData(result, 'itick')
        console.log(`股票${symbol}的K线数据已保存到数据库`)
      } catch (error) {
        console.warn(`保存K线数据失败: ${error.message}`)
        // 不抛出错误，允许数据获取但保存失败的情况
      }
    }

    return result
  }

  // 获取单只股票实时行情
  async getStockQuote(symbol) {
    const params = {
      region: this.getRegionCode(symbol),
      code: this.cleanSymbol(symbol)
    }

    const result = await rateLimiter.callWithRateLimit(
      () => this.safeApiCall('/stock/quote', params)
    )

    // 如果启用了数据库保存，保存数据
    if (ITICK_CONFIG.SAVE_TO_DB && result) {
      try {
        await dataStorageService.storeStockData(result, 'itick')
        console.log(`股票${symbol}的实时行情已保存到数据库`)
      } catch (error) {
        console.warn(`保存实时行情数据失败: ${error.message}`)
        // 不抛出错误，允许数据获取但保存失败的情况
      }
    }

    return result
  }

  // 批量获取股票行情
  async batchGetQuotes(symbols) {
    if (symbols.length > ITICK_CONFIG.BATCH_SIZE) {
      throw new Error(`单次最多支持${ITICK_CONFIG.BATCH_SIZE}只股票`)
    }

    // 根据股票代码分组设置region
    const regionGroups = {};
    symbols.forEach(symbol => {
      const region = this.getRegionCode(symbol);
      if (!regionGroups[region]) {
        regionGroups[region] = [];
      }
      regionGroups[region].push(this.cleanSymbol(symbol));
    });

    // 批量查询每个市场的股票
    const promises = Object.entries(regionGroups).map(([region, codes]) => {
      const params = {
        region: region,
        codes: codes.join(',')
      }

      return rateLimiter.callWithRateLimit(
        () => this.safeApiCall('/stock/quotes', params)
      );
    });

    const results = await Promise.all(promises);
    const result = results.flat();

    // 如果启用了数据库保存，保存数据
    if (ITICK_CONFIG.SAVE_TO_DB && result && Array.isArray(result)) {
      try {
        await Promise.all(result.map(stock => 
          dataStorageService.storeStockData(stock, 'itick').catch(err => {
            console.warn(`保存股票${stock.symbol}批量行情失败: ${err.message}`)
          })
        ))
        console.log(`批量${symbols.length}只股票行情已保存到数据库`)
      } catch (error) {
        console.warn(`批量保存行情数据失败: ${error.message}`)
      }
    }

    return result
  }

  // 获取股票基本信息
  async getStockInfo(symbol) {
    const params = {
      region: this.getRegionCode(symbol),
      code: this.cleanSymbol(symbol)
    }

    return await rateLimiter.callWithRateLimit(
      () => this.safeApiCall('/stock/info', params)
    )
  }

  // 获取A股列表
  async getAStockList() {
    return await rateLimiter.callWithRateLimit(
      () => this.safeApiCall('/stock/list', { region: 'SH,SZ' })
    )
  }

  // 根据股票代码判断市场
  getRegionCode(symbol) {
    if (symbol.startsWith('6')) {
      return 'SH' // 上海
    } else if (symbol.startsWith('0') || symbol.startsWith('3')) {
      return 'SZ' // 深圳
    } else if (symbol.startsWith('8')) {
      return 'BJ' // 北京
    } else {
      return 'SH' // 默认上海
    }
  }

  // 清理股票代码
  cleanSymbol(symbol) {
    return symbol.replace(/[^0-9]/g, '') // 移除非数字字符
  }

  // 获取K线类型映射
  getKType(period) {
    const periodMap = {
      '1min': 1,
      '5min': 2,
      '15min': 3,
      '30min': 4,
      '60min': 5,
      'daily': 6,
      'weekly': 7,
      'monthly': 8
    }
    return periodMap[period] || 6 // 默认日线
  }

  // 获取股票历史数据（支持分页和时间范围）
  async getStockHistory(symbol, startDate, endDate, period = 'daily') {
    const allData = []
    let currentEnd = new Date(endDate)
    const kType = this.getKType(period)
    
    // 每次获取3个月的数据，避免单次请求数据量过大
    while (currentEnd > new Date(startDate)) {
      let batchStart = new Date(currentEnd.getTime() - 90 * 24 * 60 * 60 * 1000)
      if (batchStart < new Date(startDate)) {
        batchStart = new Date(startDate)
      }
      
      const endTimestamp = Math.floor(currentEnd.getTime())
      
      try {
        const data = await this.getKlineData(
          symbol, 
          kType, 
          200, 
          endTimestamp
        )
        
        if (data && data.length > 0) {
          // 过滤出在时间范围内的数据
          const filteredData = data.filter(item => {
            const itemDate = new Date(item.timestamp)
            return itemDate >= new Date(startDate)
          })
          allData.push(...filteredData)
        }
        
        currentEnd = new Date(batchStart.getTime() - 24 * 60 * 60 * 1000)
        
        // 每次请求后延迟12秒，确保不超过频率限制
        if (currentEnd > new Date(startDate)) {
          await new Promise(resolve => setTimeout(resolve, 12000))
        }
        
      } catch (error) {
        console.error(`获取股票${symbol}历史数据失败:`, error)
        break
      }
    }
    
    return allData.reverse() // 按时间正序排列
  }
}

// 导出单例实例
export default new ITickApiService()