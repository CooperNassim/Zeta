// 前端数据获取调试脚本
// 在浏览器开发者工具中运行此代码

async function debugFrontendDataFlow() {
  console.log('🔍 调试前端数据获取流程...\n');
  
  try {
    // 1. 测试直接API调用
    console.log('1. 🌐 直接测试API调用:');
    const apiResponse = await fetch('http://localhost:3001/api/market-quotes/realtime');
    const apiData = await apiResponse.json();
    
    console.log(`   API状态: ${apiResponse.status}`);
    console.log(`   API响应:`, apiData);
    console.log(`   数据条数: ${apiData.count || apiData.data?.length || 0}`);
    console.log(`   是否包含301563: ${apiData.data?.some(stock => stock.symbol === '301563') || false}`);
    
    // 2. 检查marketDataService
    console.log('\n2. 🔧 检查marketDataService:');
    
    // 模拟marketDataService.getStocksFromDatabase()函数
    try {
      const response = await fetch('http://localhost:3001/api/market-quotes/realtime');
      const result = await response.json();
      
      const filteredData = result.data?.filter(stock => 
        stock.symbol && stock.current_price !== null
      ) || [];
      
      console.log(`   getStocksFromDatabase结果: ${filteredData.length} 条记录`);
      console.log(`   包含301563: ${filteredData.some(stock => stock.symbol === '301563')}`);
      
      if (filteredData.some(stock => stock.symbol === '301563')) {
        const stockInfo = filteredData.find(stock => stock.symbol === '301563');
        console.log(`   301563过滤后详情:`, stockInfo);
      }
      
    } catch (serviceError) {
      console.log(`   ❌ marketDataService调用失败: ${serviceError.message}`);
    }
    
    // 3. 检查数据格式化
    console.log('\n3. 📋 数据格式化检查:');
    
    // 模拟marketDataService.formatForMarketDisplay函数
    try {
      const response = await fetch('http://localhost:3001/api/market-quotes/realtime');
      const result = await response.json();
      
      const formattedStocks = (result.data || []).map(stock => ({
        symbol: stock.symbol,
        name: stock.name || stock.symbol,
        sector: stock.sector || '通用',
        totalMarketCap: '--',
        circulatingMarketCap: '--',
        changePercent: stock.change_percent ? parseFloat(stock.change_percent) : 0,
        currentPrice: stock.current_price ? parseFloat(stock.current_price) : 0,
        highPrice: 0,
        lowPrice: 0,
        volume: 0,
        updatedAt: stock.timestamp 
          ? new Date(stock.timestamp).toLocaleString('zh-CN')
          : new Date().toLocaleString('zh-CN'),
        openPrice: 0,
        prevClose: 0,
        dataSource: stock.data_source || 'database'
      }));
      
      console.log(`   格式化后数据: ${formattedStocks.length} 条记录`);
      console.log(`   包含301563: ${formattedStocks.some(stock => stock.symbol === '301563')}`);
      
      if (formattedStocks.some(stock => stock.symbol === '301563')) {
        const stockInfo = formattedStocks.find(stock => stock.symbol === '301563');
        console.log(`   301563格式化后详情:`, stockInfo);
      }
      
    } catch (formatError) {
      console.log(`   ❌ 数据格式化失败: ${formatError.message}`);
    }
    
    // 4. 检查前端组件接收的数据
    console.log('\n4. ⚛️ 检查前端组件状态:');
    
    // 尝试获取marketStocks状态（需要在行情中心页面运行）
    if (typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('   React DevTools可用，可以检查组件状态');
    } else {
      console.log('   React DevTools不可用，建议在浏览器开发者工具中检查marketStocks状态');
    }
    
    // 5. 检查可能的过滤条件
    console.log('\n5. 🎚️ 检查筛选条件:');
    console.log('   建议检查以下筛选条件：');
    console.log('   - selectedMarket (当前选择的证券市场)');
    console.log('   - selectedSector (当前选择的行业)');
    console.log('   - searchSymbol/searchName/searchSector (搜索框内容)');
    console.log('   - filteredStocks (筛选后的股票数据)');
    
  } catch (error) {
    console.error('❌ 前端调试失败:', error);
  }
}

// 运行调试
console.log('请将此代码复制到浏览器控制台中运行，或按F12打开开发者工具在行情中心页面执行。');
console.log('也可以直接在控制台输入：debugFrontendDataFlow()');

debugFrontendDataFlow();