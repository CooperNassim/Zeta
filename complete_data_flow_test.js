// 完整数据流测试脚本
// 在浏览器开发者工具中运行此代码

async function completeDataFlowTest() {
  console.log('🔍 完整数据流测试开始...\n');
  
  try {
    // 1. 直接API调用测试
    console.log('1. 🌐 直接测试后端API:');
    const apiResponse = await fetch('http://localhost:3001/api/market-quotes/realtime');
    const apiData = await apiResponse.json();
    
    console.log(`   API状态: ${apiResponse.status}`);
    console.log(`   数据条数: ${apiData.count || apiData.data?.length || 0}`);
    console.log(`   是否包含301563: ${apiData.data?.some(stock => stock.symbol === '301563') || false}`);
    
    if (apiData.data?.some(stock => stock.symbol === '301563')) {
      const stockInfo = apiData.data.find(stock => stock.symbol === '301563');
      console.log(`   301563详情:`, stockInfo);
    }
    
    // 2. 检查marketDataService数据获取
    console.log('\n2. 🔧 测试marketDataService.getStocksFromDatabase():');
    
    // 模拟getStocksFromDatabase函数
    try {
      const response = await fetch('http://localhost:3001/api/market-quotes/realtime');
      const result = await response.json();
      
      const dbData = result.data?.filter(stock => 
        stock.symbol && stock.current_price !== null
      ) || [];
      
      console.log(`   数据库获取结果: ${dbData.length} 条记录`);
      console.log(`   包含301563: ${dbData.some(stock => stock.symbol === '301563')}`);
      
    } catch (dbError) {
      console.log(`   ❌ 数据库获取失败: ${dbError.message}`);
    }
    
    // 3. 检查前端数据格式化
    console.log('\n3. 📋 检查前端数据格式化:');
    
    // 获取原始数据
    const response = await fetch('http://localhost:3001/api/market-quotes/realtime');
    const result = await response.json();
    const rawData = result.data || [];
    
    // 模拟marketDataService.formatForMarketDisplay
    const formattedData = rawData.map(stock => ({
      symbol: stock.symbol,
      name: stock.name || stock.symbol,
      sector: stock.sector || '通用',
      totalMarketCap: '--',
      circulatingMarketCap: '--',
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
    }));
    
    console.log(`   格式化后数据: ${formattedData.length} 条记录`);
    console.log(`   包含301563: ${formattedData.some(stock => stock.symbol === '301563')}`);
    
    // 4. 模拟前端数据过滤逻辑
    console.log('\n4. 🎚️ 模拟前端数据过滤:');
    
    // 模拟MarketQuotes.jsx中的过滤逻辑
    const simulateFilter = () => {
      const marketStocks = formattedData;
      const selectedMarket = 'cn'; // 默认选择的市场
      const selectedSector = '全部'; // 默认选择的行业
      const searchSymbol = ''; // 默认搜索框为空
      const searchName = ''; // 默认名称搜索为空
      const searchSector = ''; // 默认行业搜索为空
      
      const filteredStocks = marketStocks.filter(stock => {
        // 市场过滤
        if (selectedMarket !== 'cn' && stock.market !== selectedMarket) {
          return false;
        }
        
        // 行业过滤（注意：来自数据库的数据sector字段是"通用"）
        if (selectedSector !== '全部' && stock.sector !== selectedSector) {
          return false;
        }
        
        // 代码搜索过滤
        if (searchSymbol && !stock.symbol.toLowerCase().includes(searchSymbol.toLowerCase())) {
          return false;
        }
        
        // 名称搜索过滤
        if (searchName && !stock.name.toLowerCase().includes(searchName.toLowerCase())) {
          return false;
        }
        
        // 行业搜索过滤
        if (searchSector && !stock.sector.toLowerCase().includes(searchSector.toLowerCase())) {
          return false;
        }
        
        return true;
      });
      
      return filteredStocks;
    };
    
    const filteredResult = simulateFilter();
    console.log(`   过滤后结果: ${filteredResult.length} 条记录`);
    console.log(`   包含301563: ${filteredResult.some(stock => stock.symbol === '301563')}`);
    
    if (filteredResult.some(stock => stock.symbol === '301563')) {
      const stockInfo = filteredResult.find(stock => stock.symbol === '301563');
      console.log(`   过滤后301563详情:`, stockInfo);
    }
    
    // 5. 问题诊断
    console.log('\n5. 🔍 问题诊断结果:');
    
    if (apiData.data?.some(stock => stock.symbol === '301563')) {
      console.log('   ✅ 后端API包含301563数据');
    } else {
      console.log('   ❌ 后端API不包含301563数据，请检查API查询逻辑');
    }
    
    if (formattedData.some(stock => stock.symbol === '301563')) {
      console.log('   ✅ 数据格式化后包含301563数据');
    } else {
      console.log('   ❌ 数据格式化后丢失301563数据');
    }
    
    if (filteredResult.some(stock => stock.symbol === '301563')) {
      console.log('   ✅ 前端过滤逻辑通过301563数据');
    } else {
      console.log('   ❌ 前端过滤逻辑可能丢弃301563数据');
    }
    
    // 6. 解决方案建议
    console.log('\n6. 💡 解决方案:');
    console.log('   - 检查数据库: 确认API是否从stock_pool表查询');
    console.log('   - 检查前端控制台: 查看console.log输出');
    console.log('   - 检查筛选条件: selectedMarket, selectedSector等');
    console.log('   - 暂时清空搜索框: 确保没有过滤条件');
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

// 运行测试
console.log('请将此代码复制到浏览器控制台中运行，或按F12打开开发者工具在行情中心页面执行。');
console.log('执行命令: completeDataFlowTest()');