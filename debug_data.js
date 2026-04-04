// 调试脚本：检查当前前端数据状态
console.log('=== 前端数据状态调试 ===');

// 假设这是从浏览器控制台获取的数据状态
// 模拟交易记录数据
const tradeRecords = [
  { id: 1, symbol: 'AAPL', buyQuantity: 100, sellQuantity: 0, buyAmount: 188200, sellAmount: 0, deleted: false, tradeNumber: '20260404001' },
  { id: 2, symbol: 'GOOGL', buyQuantity: 100, sellQuantity: 0, buyAmount: 188200, sellAmount: 0, deleted: false, tradeNumber: '20260404002' },
  { id: 3, symbol: 'MSFT', buyQuantity: 100, sellQuantity: 0, buyAmount: 188200, sellAmount: 0, deleted: false, tradeNumber: '20260404003' },
  { id: 4, symbol: 'TSLA', buyQuantity: 100, sellQuantity: 100, buyAmount: 188200, sellAmount: 188200, deleted: false, tradeNumber: '20260404004' }
];

// 模拟账单明细数据
const transactions = [
  { id: 1, createdAt: '2026-04-04T10:00:00', balance: 88200, type: '股票交易', deleted: false },
  { id: 2, createdAt: '2026-04-04T09:00:00', balance: 75200, type: '手动入账', deleted: false },
  { id: 3, createdAt: '2026-04-04T08:00:00', balance: 61200, type: '股票交易', deleted: false }
];

console.log('\n📊 交易记录 (总数:', tradeRecords.length, ')');
tradeRecords.forEach((r, i) => {
  const isHolding = r.sellQuantity < r.buyQuantity;
  console.log(`  记录${i+1}: ${r.symbol}, 买入${r.buyQuantity}股(${r.buyAmount}), 卖出${r.sellQuantity}股(${r.sellAmount}), ${isHolding ? '持仓中' : '已结束'}`);
});

console.log('\n📋 账单明细 (总数:', transactions.length, ')');
transactions.forEach((t, i) => {
  console.log(`  记录${i+1}: 余额${t.balance}, 类型${t.type}, 时间${t.createdAt}`);
});

// 计算持仓市值
const holdingRecords = tradeRecords.filter(r => r.sellQuantity < r.buyQuantity);
const buyAmountSum = holdingRecords.reduce((sum, r) => sum + r.buyAmount, 0);
const sellAmountSum = holdingRecords.reduce((sum, r) => sum + r.sellAmount, 0);
const holdingMarketValue = buyAmountSum - sellAmountSum;

console.log('\n🧮 持仓市值计算:');
console.log('  - 持仓中记录数:', holdingRecords.length);
console.log('  - Σ买入金额:', buyAmountSum);
console.log('  - Σ卖出金额:', sellAmountSum);
console.log('  - 持仓市值:', holdingMarketValue);

// 获取最新余额
const latestTransaction = transactions
  .filter(t => !t.deleted)
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
const currentBalance = latestTransaction ? latestTransaction.balance : 0;

console.log('\n💰 最新余额:');
console.log('  - 最新记录余额:', currentBalance);
console.log('  - 记录时间:', latestTransaction.createdAt);

// 计算总资产
const totalAssets = holdingMarketValue + currentBalance;

console.log('\n🔢 总资产计算结果:');
console.log('  - 持仓市值:', holdingMarketValue);
console.log('  - 最新余额:', currentBalance);
console.log('  - 总资产:', totalAssets);

// 预期验证
const expectedTotal = 564600 + 88200; // 564600 = 3 * 188200
console.log('\n🎯 预期总资产验证:');
console.log('  - 预期: 564600 + 88200 = 652800');
console.log('  - 实际: ', totalAssets);
console.log('  - 偏差: ', totalAssets - 652800);