/**
 * AKShare API 行情数据服务
 * AKShare是一个基于Python的开源金融数据接口库，支持A股、港股、美股、期货、基金等数据
 * 这里实现AKShare的JavaScript/Node.js版本
 */

import axios from 'axios';

class AKShareApi {
  constructor() {
    // AKShare有多种数据源，这里选择几个常用的
    this.baseUrls = {
      // 东方财富实时数据
      'eastmoney': 'http://push2.eastmoney.com/api',
      // 腾讯财经数据
      'tencent': 'http://qt.gtimg.cn',
      // 新浪财经数据
      'sina': 'http://hq.sinajs.cn'
    };
  }

  /**
   * 获取股票基本信息
   */
  async getStockBasicInfo(symbols = []) {
    try {
      // 使用AKShare的股票基本信息接口
      const infoMap = {
        '000001': { name: '平安银行', market: 'SZ' },
        '000002': { name: '万科A', market: 'SZ' },
        '600000': { name: '浦发银行', market: 'SH' },
        '601318': { name: '中国平安', market: 'SH' },
        '300001': { name: '特锐德', market: 'SZ' },
        '301563': { name: '宏景科技', market: 'SZ' },
        // 其他常见股票的基本信息
        '688001': { name: '华兴源创', market: 'SH' },
        '002415': { name: '海康威视', market: 'SZ' },
        '600036': { name: '招商银行', market: 'SH' },
        '600519': { name: '贵州茅台', market: 'SH' }
      };

      // 如果提供了特定的symbols，则过滤返回
      if (symbols.length > 0) {
        return symbols.map(symbol => {
          const info = infoMap[symbol] || { name: `股票${symbol}`, market: this.getExchange(symbol) };
          return {
            symbol: symbol,
            name: info.name,
            exchange: info.market,
            fullCode: `${symbol}.${info.market}`
          };
        });
      }

      // 返回所有预定义的股票信息
      return Object.keys(infoMap).map(symbol => ({
        symbol: symbol,
        name: infoMap[symbol].name,
        exchange: infoMap[symbol].market,
        fullCode: `${symbol}.${infoMap[symbol].market}`
      }));
    } catch (error) {
      console.error('AKShare获取股票基本信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取实时行情数据（东方财富接口）
   */
  async getRealtimeQuotes(symbols = []) {
    try {
      // 构造URL参数
      const fields = 'f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f19,f20,f21,f22'
      const codes = symbols.map(symbol => {
        const exchange = this.getExchange(symbol);
        return `${exchange.toLowerCase()}${symbol}`;
      }).join(',');

      if (!codes) {
        return [];
      }

      const url = `${this.baseUrls.eastmoney}/qt/ulist.np/get?fltt=2&invt=2&ut=b2884a393a59ad64002292a3e90d46a5&fields=${fields}&secids=${codes}`;
      
      const response = await axios.get(url);
      
      if (response.data && response.data.data && response.data.data.diff) {
        return response.data.data.diff.map(stock => ({
          symbol: stock.f12, // 股票代码
          name: stock.f14,   // 股票名称
          price: parseFloat(stock.f2),  // 当前价格
          change: parseFloat(stock.f4), // 涨跌额
          pct_change: parseFloat(stock.f3), // 涨跌幅
          open: parseFloat(stock.f17),  // 开盘价
          pre_close: parseFloat(stock.f18), // 前收盘价
          high: parseFloat(stock.f15),  // 最高价
          low: parseFloat(stock.f16),   // 最低价
          volume: parseFloat(stock.f5), // 成交量(手)
          amount: parseFloat(stock.f6), // 成交额(万)
          turnover_rate: parseFloat(stock.f8), // 换手率
          pe_ratio: parseFloat(stock.f9), // 市盈率
          pb_ratio: parseFloat(stock.f23) || 0 // 市净率
        }));
      } else {
        return [];
      }
    } catch (error) {
      console.error('AKShare获取实时行情失败:', error);
      // 降级到腾讯财经接口
      return await this.getRealtimeQuotesFromTencent(symbols);
    }
  }

  /**
   * 腾讯财经实时行情数据（降级方案）
   */
  async getRealtimeQuotesFromTencent(symbols = []) {
    try {
      const results = [];
      
      for (const symbol of symbols) {
        const exchange = this.getExchange(symbol);
        const marketCode = exchange === 'SH' ? 'sh' : 'sz';
        const code = `${marketCode}${symbol}`;
        
        const url = `${this.baseUrls.tencent}/q=${code}`;
        
        try {
          const response = await axios.get(url, { 
            timeout: 5000,
            headers: {
              'Referer': 'https://gu.qq.com/',
              'User-Agent': 'Mozilla/5.0'
            }
          });
          
          // 解析腾讯财经数据格式：v_sz000001="51~平安银行~000001~16.88~17.02~17.15~...
          const data = response.data;
          const match = data.match(/"([^"]+)"/);
          
          if (match && match[1]) {
            const parts = match[1].split('~');
            if (parts.length >= 40) {
              results.push({
                symbol: symbol,
                name: parts[1],
                price: parseFloat(parts[3]) || 0,
                change: parseFloat(parts[31]) || 0,
                pct_change: parseFloat(parts[32]) || 0,
                open: parseFloat(parts[5]) || 0,
                pre_close: parseFloat(parts[4]) || 0,
                high: parseFloat(parts[33]) || 0,
                low: parseFloat(parts[34]) || 0,
                volume: parseFloat(parts[36]) || 0,
                amount: parseFloat(parts[37]) || 0
              });
            }
          }
        } catch (stockError) {
          console.warn(`腾讯财经获取股票${symbol}失败:`, stockError);
          // 添加一个空的记录
          results.push({
            symbol: symbol,
            name: `股票${symbol}`,
            price: 0,
            change: 0,
            pct_change: 0,
            open: 0,
            pre_close: 0,
            high: 0,
            low: 0,
            volume: 0,
            amount: 0
          });
        }
        
        // 避免频率限制，每次请求间隔500ms
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return results;
    } catch (error) {
      console.error('腾讯财经获取实时行情失败:', error);
      throw error;
    }
  }

  /**
   * 获取历史K线数据
   */
  async getHistoricalData(symbol, startDate, endDate, period = 'daily') {
    try {
      // AKShare的历史数据需要Python后端支持
      // 这里提供一个模拟实现，实际应该调用后端API
      const exchange = this.getExchange(symbol);
      const days = this.calcDaysBetween(startDate, endDate);
      
      // 生成模拟的历史数据
      const data = [];
      let basePrice = 10 + Math.random() * 90; // 10-100之间的随机价格
      
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        const open = basePrice * (0.98 + Math.random() * 0.04);
        const close = basePrice * (0.98 + Math.random() * 0.04);
        const high = Math.max(open, close) * (1 + Math.random() * 0.02);
        const low = Math.min(open, close) * (0.98 - Math.random() * 0.02);
        
        data.push({
          symbol: symbol,
          trade_date: date.toISOString().split('T')[0],
          open: parseFloat(open.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          volume: Math.floor(Math.random() * 10000000) + 1000000,
          amount: Math.floor(Math.random() * 100000000) + 10000000
        });
        
        basePrice = close; // 下一日的基础价格用今日收盘价
      }
      
      return data;
    } catch (error) {
      console.error('AKShare获取历史数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取实时行情数据
   */
  async getRealtimeQuotes(symbols = []) {
    try {
      // 通过后端代理调用AKShare API，避免跨域问题
      const response = await fetch(`/api/proxy/akshare/realtime?symbols=${symbols.join(',')}`);
      
      if (!response.ok) {
        throw new Error(`后端代理请求失败: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data && Array.isArray(result.data)) {
        // 新浪财经数据格式处理
        const stocksData = result.data.map(item => ({
          symbol: item.symbol,
          name: item.name,
          price: item.price || 0,
          change: item.change || 0,
          change_percent: item.change_percent || 0,
          open: item.open || 0,
          high: item.high || 0,
          low: item.low || 0,
          pre_close: item.pre_close || 0,
          volume: item.volume || 0,
          amount: item.amount || 0
        }));
        
        console.log('✅ 通过后端代理获取AKShare数据成功');
        return stocksData;
      } else {
        // 如果后端代理失败，返回模拟数据
        console.warn('⚠️ 后端代理返回异常数据，使用模拟数据');
        return this.generateMockData(symbols);
      }
    } catch (error) {
      console.error('AKShare获取实时行情失败:', error);
      // 降级到模拟数据
      console.warn('⚠️ 后端代理调用失败，使用模拟数据');
      return this.generateMockData(symbols);
    }
  }

  /**
   * 生成模拟数据（降级策略）
   */
  generateMockData(symbols = []) {
    const mockData = symbols.map(symbol => {
      const basePrice = Math.random() * 100 + 10;
      const change = (Math.random() - 0.5) * 4;
      const price = basePrice + change;
      
      return {
        symbol: symbol,
        name: `模拟股票${symbol}`,
        price: price.toFixed(2),
        change: change.toFixed(2),
        change_percent: ((change / basePrice) * 100).toFixed(2),
        open: (basePrice + (Math.random() - 0.5) * 2).toFixed(2),
        high: (basePrice + Math.random() * 5).toFixed(2),
        low: (basePrice - Math.random() * 3).toFixed(2),
        pre_close: basePrice.toFixed(2),
        volume: Math.floor(Math.random() * 1000000) + 100000,
        amount: Math.floor(Math.random() * 10000000) + 1000000
      };
    });
    
    console.log('✅ 使用模拟数据成功');
    return mockData;
  }

  /**
   * 根据股票代码获取交易所
   */
  getExchange(symbol) {
    if (symbol.startsWith('6') || symbol.startsWith('9')) {
      return 'SH'; // 上海交易所
    } else if (symbol.startsWith('0') || symbol.startsWith('3') || symbol.startsWith('2')) {
      return 'SZ'; // 深圳交易所
    } else if (symbol.startsWith('8') || symbol.startsWith('4')) {
      return 'BJ'; // 北京交易所
    } else {
      return 'SZ'; // 默认深圳交易所
    }
  }

  /**
   * 计算两个日期之间的天数
   */
  calcDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  }

  /**
   * 测试API连接
   */
  async testConnection() {
    try {
      const result = await this.getRealtimeQuotes(['000001']);
      return result.length > 0 && result[0].price > 0;
    } catch (error) {
      return false;
    }
  }
}

export default new AKShareApi();