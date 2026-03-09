import fs from 'fs';
const path = 'd:/Code/Zeta/src/store/useStore.js';
let content = fs.readFileSync(path, 'utf8');

// 找到 tradeRecords 数组的开始和结束位置
const tradeRecordsStart = content.indexOf('tradeRecords: [');
const tradeRecordsEnd = content.indexOf('],', tradeRecordsStart + 20);

// 提取交易记录数组
const tradeRecordsStr = content.substring(tradeRecordsStart, tradeRecordsEnd + 2);
let records = JSON.parse(tradeRecordsStr.substring('tradeRecords: '.length).replace(/],$/, ']'));

// 为每条记录添加预约价格字段
records.forEach(record => {
  if (record.tradeType === '买入') {
    // 添加买入预约价格（比实际买入价低3-5）
    const priceOffset = (Math.random() * 2 + 3).toFixed(2);
    record.buyOrderPrice = parseFloat((record.buyPrice - priceOffset).toFixed(2));

    // 添加买入预约时间（比实际买入时间早1-2天）
    const buyTime = new Date(record.buyTime);
    const daysBefore = Math.floor(Math.random() * 2) + 1;
    buyTime.setDate(buyTime.getDate() - daysBefore);
    record.buyOrderTime = buyTime.toISOString();

    // 卖出预约价格设为null
    record.sellOrderPrice = null;
    record.sellOrderTime = null;
  } else if (record.tradeType === '卖出') {
    // 添加卖出预约价格（比实际卖出价高3-5）
    const priceOffset = (Math.random() * 2 + 3).toFixed(2);
    record.sellOrderPrice = parseFloat((record.sellPrice + priceOffset).toFixed(2));

    // 添加卖出预约时间（比实际卖出时间早1-2天）
    const sellTime = new Date(record.sellTime);
    const daysBefore = Math.floor(Math.random() * 2) + 1;
    sellTime.setDate(sellTime.getDate() - daysBefore);
    record.sellOrderTime = sellTime.toISOString();
  }
});

// 将更新后的记录转换回字符串格式
const newTradeRecordsStr = 'tradeRecords: ' + JSON.stringify(records, null, 8);

// 替换原数组
const newContent = content.substring(0, tradeRecordsStart) + newTradeRecordsStr + content.substring(tradeRecordsEnd + 2);

// 写回文件
fs.writeFileSync(path, newContent, 'utf8');
console.log('交易记录更新完成');
