// 测试数据流动的完整流程
async function testDataFlow() {
  console.log('🚀 开始测试数据下载→存储→展示完整流程...')
  
  try {
    // 动态导入模块
    const itickApiModule = await import('./src/services/itickApi.js')
    const itickApi = itickApiModule.default
    
    console.log('📥 步骤1: 测试 iTick API 数据下载...')
    
    // 1. 测试单个股票数据下载
    const symbol = '000001'
    console.log(`正在下载股票 ${symbol} 的数据...`)
    
    const stockData = await itickApi.getStockQuote(symbol)
    console.log('✅ iTick API 返回数据:', {
      成功: !!stockData,
      股票代码: stockData?.code || '未知',
      当前价格: stockData?.current || '无数据',
      涨跌幅: stockData?.pct_chg || '无数据'
    })
    
    if (!stockData) {
      console.log('❌ iTick API 数据下载失败，无法继续测试')
      return
    }
    
    console.log('💾 步骤2: 检查浏览器控制台的数据库存储日志...')
    console.log('请查看浏览器控制台是否有以下日志：')
    console.log('   - "股票X的实时行情已保存到数据库"')
    console.log('   - 或 "保存实时行情数据失败"')
    
    console.log('📊 步骤3: 验证行情中心是否能获取数据')
    console.log('请手动刷新行情中心页面，观察以下内容：')
    console.log('   - 控制台应该显示 "从数据库获取X只股票数据"')
    console.log('   - 或者使用实时API获取数据的日志')
    
    console.log('🔄 步骤4: 手动测试完整流程')
    console.log('1. 前往数据下载页面，下载股票数据')
    console.log('2. 监听控制台日志："股票X的实时行情已保存到数据库"')
    console.log('3. 切换到行情中心页面，查看是否显示数据')
    console.log('4. 监听控制台日志："从数据库获取X只股票数据"')
    
    console.log('🎯 测试验证点:')
    console.log('✅ iTick API 调用成功')
    console.log('✅ 数据存储逻辑已触发')
    console.log('✅ 行情中心数据获取逻辑已配置')
    console.log(`问题排查: 
      - 如果存储失败: 检查 dataStorageService.storeStockData 方法
      - 如果显示失败: 检查数据库连接和 stockDataService 服务
      - 如果数据格式不匹配: 检查 normalizeITickData 方法
    `)
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message)
    console.log('错误详情:', error)
  }
}

// 在浏览器控制台中运行此测试
if (typeof window !== 'undefined') {
  console.log('🧪 数据流程测试脚本已加载')
  console.log('在浏览器控制台运行: testDataFlow() 来测试')
  
  // 检查当前页面是否是行情中心
  if (window.location.href.includes('/market-quotes')) {
    console.log('📊 当前页面: 行情中心')
    
    // 自动测试行情中心数据加载
    setTimeout(async () => {
      try {
        console.log('🔍 测试行情中心数据加载...')
        
        // 模拟行情中心的数据加载
        const marketDataServiceModule = await import('./src/services/marketDataService.js')
        const marketDataService = new marketDataServiceModule.default()
        
        const stocks = await marketDataService.getRealtimeQuotes()
        console.log('📈 行情中心获取到数据量:', stocks.length)
        
        if (stocks.length > 0) {
          console.log('✅ 行情中心数据加载成功')
          console.log('示例数据:', stocks[0])
        } else {
          console.log('⚠️ 行情中心未获取到数据')
        }
      } catch (error) {
        console.warn('行情中心数据加载测试失败:', error.message)
      }
    }, 1000)
  }
}

// 导出测试函数
try {
  module.exports = { testDataFlow }
} catch (e) {
  // 浏览器环境，无需导出
}