// 数据加载器 - 从后端 API 获取历史 K 线数据
const API_BASE_URL = ''

export class DataLoader {
  async load(stockCode, startDate, endDate) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/stock-kline/${encodeURIComponent(stockCode)}?startDate=${startDate}&endDate=${endDate}`,
        { method: 'GET' }
      )
      
      if (!response.ok) {
        throw new Error(`数据加载失败: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error(`股票 ${stockCode} 在 ${startDate} 至 ${endDate} 期间无数据`)
      }
      
      return this.normalizeKlineData(result.data)
    } catch (error) {
      throw new Error(`加载 ${stockCode} 数据失败: ${error.message}`)
    }
  }

  normalizeKlineData(rawData) {
    return rawData
      .map(item => ({
        date: item.trade_date || item.date,
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume || item.vol || 0),
        amount: parseFloat(item.amount || 0),
        change: parseFloat(item.pct_chg || item.change || 0),
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  validateMinimumData(klineData, requiredDays = 60) {
    if (klineData.length < requiredDays) {
      throw new Error(`数据不足，需要至少 ${requiredDays} 天数据，当前只有 ${klineData.length} 天`)
    }
    return true
  }
}
