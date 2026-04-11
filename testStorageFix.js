// 测试存储修复效果
async function testStorageFix() {
  console.log('🧪 测试数据存储修复...')
  
  try {
    // 动态导入模块
    const itickApiModule = await import('./src/services/itickApi.js')
    const itickApi = itickApiModule.default
    
    const storageServiceModule = await import('./src/services/dataStorageService.js')
    const storageService = storageServiceModule.default
    
    // 1. 测试单只股票下载和存储
    console.log('1️⃣ 测试股票 301563 下载和存储...')
    const stock = await itickApi.getStockQuote('301563')
    
    if (stock) {
      console.log('✅ 下载成功:', stock.code, stock.current)
    } else {
      console.log('❌ 下载失败')
    }
    
    // 2. 直接测试存储服务
    console.log('2️⃣ 直接测试存储服务...')
    const testData = {
      symbol: '301563',
      current_price: 25.8,
      prev_close: 25.5,
      name: '测试股票',
      change_percent: 1.18
    }
    
    const result = await storageService.storeStockData(testData, 'test')
    console.log('存储结果:', result)
    
  } catch (error) {
    console.error('测试失败:', error.message)
  }
}

// 如果在浏览器环境，导出到全局
if (typeof window !== 'undefined') {
  window.testStorageFix = testStorageFix
  console.log('测试脚本已加载，运行 testStorageFix() 开始测试')
}

module.exports = { testStorageFix }