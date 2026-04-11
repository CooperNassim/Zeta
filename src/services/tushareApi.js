/**
 * Tushare API 行情数据服务
 * Tushare是一个专业的财经数据接口平台，提供高质量的A股、港股、基金、期货等行情数据
 */

import axios from 'axios';

class TushareApi {
  constructor() {
    // Tushare API基础URL
    this.baseUrl = 'https://tushare.pro';
    // Tushare API Token（需要在环境变量中配置）
    this.token = import.meta.env?.REACT_APP_TUSHARE_TOKEN || '';
    
    if (!this.token) {
      console.warn('Tushare API Token未配置，请在环境变量中设置REACT_APP_TUSHARE_TOKEN');
    }
  }

  /**
   * 获取股票基本信息
   */
  async getStockBasicInfo(symbols = []) {
    try {
      // 构建Tushare API请求的正确格式
      const requestData = {
        api_name: 'stock_basic',
        token: this.token,
        params: {
          list_status: 'L', // 只获取上市中的股票
          exchange: '' // 不限制交易所，获取所有A股
        },
        fields: 'ts_code,symbol,name,area,industry,market,list_date,list_status,exchange'
      };

      // 通过后端代理调用Tushare API - 使用POST请求传递JSON数据
      const response = await fetch('/api/proxy/tushare/stock_basic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`后端代理请求失败: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.code === 0) {
        let stocks = result.data.items || [];
        
        console.log(`Tushare API返回股票数量: ${stocks.length}`);
        
        // 过滤指定代码的股票（如果提供了参数）
        if (symbols.length > 0) {
          stocks = stocks.filter(stock => {
            const code = stock[0].slice(0, 6); // ts_code格式如: 000001.SZ
            return symbols.some(symbol => symbol === code);
          });
        }

        // 转换为统一的格式
        const formattedStocks = stocks.map(stock => {
          const [tsCode, symbol, name, area, industry, market, listDate, listStatus, exchange] = stock;
          return {
            ts_code: tsCode,
            symbol: symbol,
            name: name,
            fullCode: tsCode,
            exchange: exchange || tsCode.slice(-2),
            area: area,
            industry: industry,
            market: market,
            listDate: listDate,
            list_status: listStatus
          };
        });
        
        return formattedStocks;
      } else {
        throw new Error(`Tushare API错误: ${result.msg}`);
      }
    } catch (error) {
      console.error('Tushare获取股票基本信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取实时行情数据
   */
  async getRealtimeQuotes(symbols = []) {
    try {
      const params = {
        api_name: 'realtime_quote',
        token: this.token,
        params: {},
        fields: 'ts_code,trade_date,trade_time,open,high,low,pre_close,price,vol,amount'
      };

      const response = await axios.post(this.baseUrl, params);
      
      if (response.data.code === 0) {
        let data = response.data.data.items;
        
        // 过滤指定代码的股票
        if (symbols.length > 0) {
          data = data.filter(stock => {
            const code = stock[0].slice(0, 6);
            return symbols.some(symbol => symbol === code);
          });
        }

        // 转换为统一的格式
        return data.map(stock => ({
          symbol: stock[0].slice(0, 6),
          name: '', // 实时行情不包含名称
          trade_date: stock[1],
          trade_time: stock[2],
          open: parseFloat(stock[3]),
          high: parseFloat(stock[4]),
          low: parseFloat(stock[5]),
          pre_close: parseFloat(stock[6]),
          price: parseFloat(stock[7]),
          volume: parseFloat(stock[8]),
          amount: parseFloat(stock[9]),
          change: parseFloat(stock[7]) - parseFloat(stock[6]),
          pct_change: ((parseFloat(stock[7]) - parseFloat(stock[6])) / parseFloat(stock[6]) * 100).toFixed(2)
        }));
      } else {
        throw new Error(`Tushare API错误: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('Tushare获取实时行情失败:', error);
      throw error;
    }
  }

  /**
   * 获取历史K线数据
   */
  async getHistoricalData(symbol, startDate, endDate, period = 'daily') {
    try {
      // 映射周期参数
      const freqMap = {
        'daily': 'D',
        'weekly': 'W',
        'monthly': 'M',
        '5m': '5MIN',
        '15m': '15MIN',
        '30m': '30MIN',
        '60m': '60MIN'
      };

      const exchange = this.getExchange(symbol);
      const tsCode = `${symbol}.${exchange}`;

      const params = {
        api_name: 'pro_bar',
        token: this.token,
        params: {
          ts_code: tsCode,
          start_date: startDate.replace(/-/g, ''),
          end_date: endDate.replace(/-/g, ''),
          freq: freqMap[period] || 'D'
        },
        fields: 'trade_date,open,high,low,close,vol,amount'
      };

      const response = await axios.post(this.baseUrl, params);
      
      if (response.data.code === 0) {
        return response.data.data.items.map(item => ({
          symbol: symbol,
          trade_date: item[0],
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5]),
          amount: parseFloat(item[6])
        }));
      } else {
        throw new Error(`Tushare API错误: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('Tushare获取历史数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取实时行情数据
   */
  async getRealtimeQuotes(symbols = []) {
    try {
      if (!this.token) {
        throw new Error('Tushare API Token未配置');
      }
      
      // 构建Tushare API请求的正确格式
      const requestData = {
        api_name: 'realtime_quote',
        token: this.token,
        fields: 'ts_code,trade_date,trade_time,open,high,low,pre_close,price,vol,amount,change,pct_chg'
      };
      
      // 如果有指定股票代码
      if (symbols && symbols.length > 0) {
        // 转换股票代码格式：301563 -> 301563.SZ
        requestData.params = {
          ts_code: symbols.map(symbol => {
            const market = symbol.startsWith('6') ? '.SH' : '.SZ';
            return symbol + market;
          }).join(',')
        };
      }
      
      // 通过后端代理调用Tushare API - 使用POST请求传递JSON数据
      const response = await fetch('/api/proxy/tushare/realtime_quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`后端代理请求失败: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.code === 0) {
        const stocks = result.data.items || [];
        
        // 转换数据格式
        const formattedStocks = stocks.map(stock => {
          const [tsCode, tradeDate, tradeTime, open, high, low, preClose, price, volume, amount, change, pctChg] = stock;
          
          return {
            symbol: tsCode.split('.')[0], // 去除交易所后缀
            name: `股票${tsCode.split('.')[0]}`, // Tushare不提供股票名称，用占位符
            price: price,
            open: open,
            high: high,
            low: low,
            pre_close: preClose,
            change: change,
            change_percent: pctChg,
            volume: volume,
            amount: amount,
            trade_date: tradeDate,
            trade_time: tradeTime
          };
        });
        
        console.log('✅ 通过后端代理获取Tushare数据成功');
        return formattedStocks;
      } else {
        throw new Error(`Tushare API错误: ${result.msg}`);
      }
    } catch (error) {
      console.error('Tushare获取实时行情失败:', error);
      throw new Error(`获取实时行情失败: ${error.message}`);
    }
  }

  /**
   * 批量获取股票数据（支持分批次处理）
   */
  async getBatchData(symbols = [], dataType = 'realtime') {
    const results = [];
    
    // Tushare API对批量请求有限制，分批处理
    const batchSize = 50;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batchSymbols = symbols.slice(i, i + batchSize);
      
      try {
        let data;
        if (dataType === 'realtime') {
          data = await this.getRealtimeQuotes(batchSymbols);
        } else {
          data = await this.getStockBasicInfo(batchSymbols);
        }
        
        results.push(...data);
        
        // 避免频率限制，每次请求间隔1秒
        if (i + batchSize < symbols.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Tushare批量处理失败(批次${i/batchSize + 1}):`, error);
      }
    }
    
    return results;
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
   * 测试API连接
   */
  async testConnection() {
    try {
      await this.getStockBasicInfo(['000001']);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new TushareApi();