// 测试交易结案弹窗修复
const testTradeRecordsFix = async () => {
  console.log('开始测试交易结案弹窗修复...');
  
  try {
    // 模拟获取交易记录
    const response = await fetch('/api/trade_records');
    const result = await response.json();
    
    if (!result.success || !result.data || result.data.length === 0) {
      console.log('没有找到交易记录，跳过测试');
      return;
    }
    
    // 找到第一个买入记录
    const buyRecord = result.data.find(r => r.tradeType === '买入' && !r.deleted);
    if (!buyRecord) {
      console.log('没有找到买入记录，跳过测试');
      return;
    }
    
    console.log('找到测试记录:', buyRecord.id, buyRecord.symbol);
    
    // 记录原始价格
    const originalBuyPrice = buyRecord.buyPrice;
    const newBuyPrice = originalBuyPrice ? originalBuyPrice + 1 : 100.50;
    
    console.log(`原始买入价: ${originalBuyPrice}, 新买入价: ${newBuyPrice}`);
    
    // 第一次修改
    const updateResponse = await fetch(`/api/trade_records/${buyRecord.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buy_price: newBuyPrice
      })
    });
    
    const updateResult = await updateResponse.json();
    if (!updateResult.success) {
      console.log('第一次修改失败');
      return;
    }
    
    console.log('第一次修改成功');
    
    // 立即读取数据验证
    const verifyResponse = await fetch('/api/trade_records');
    const verifyResult = await verifyResponse.json();
    
    if (verifyResult.success && verifyResult.data) {
      const updatedRecord = verifyResult.data.find(r => r.id === buyRecord.id);
      if (updatedRecord && updatedRecord.buyPrice === newBuyPrice) {
        console.log('✅ 第一次修改立即生效，修复成功！');
      } else {
        console.log('❌ 第一次修改未生效，可能仍有问题');
        console.log('实际值:', updatedRecord?.buyPrice, '期望值:', newBuyPrice);
      }
    }
    
    // 恢复原始价格
    await fetch(`/api/trade_records/${buyRecord.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buy_price: originalBuyPrice
      })
    });
    
    console.log('测试完成，已恢复原始数据');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
};

// 运行测试
testTradeRecordsFix();