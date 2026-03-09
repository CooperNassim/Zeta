import fs from 'fs';
import { readFileSync, writeFileSync } from 'fs';

const filePath = 'd:/Code/Zeta/src/store/useStore.js';
let content = readFileSync(filePath, 'utf8');

// 找到所有交易记录并更新
// 为每条买入记录添加预约价格字段
content = content.replace(/(id: 'trade_\d+',\s*tradeNumber: '[^']+',\s*tradeType: '买入',[^}]*buyPrice: [\d.]+,\s*buyQuantity: [\d]+,\s*buyTime: '[^']+',)\s*(buyPsychologicalScore:)/g,
  '$1\n          buyOrderPrice: 1645.00,\n          buyOrderTime: \'2024-02-14T15:00:00.000Z\',\n          $2');

// 为每条卖出记录添加预约价格字段
content = content.replace(/(id: 'trade_\d+_sell',\s*tradeNumber: '[^']+',\s*tradeType: '卖出',[^}]*sellPrice: [\d.]+,\s*sellQuantity: [\d]+,\s*sellTime: '[^']+',)\s*(sellPsychologicalScore:)/g,
  '$1\n          sellOrderPrice: 1720.00,\n          sellOrderTime: \'2024-02-28T14:30:00.000Z\',\n          $2');

writeFileSync(filePath, content, 'utf8');
console.log('交易记录更新完成');
