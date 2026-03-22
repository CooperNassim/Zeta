# 可卖出数量计算问题修复总结

## 问题描述
交易编号 20260322005:
- 买入数量: 188300
- 卖出数量: 188000
- 但创建新卖出订单时,仍显示可卖出 188300 (应该是 300)

## 根本原因

1. **数据库缺少 `buy_order_id` 字段**
   - `trade_orders` 表最初设计时没有 `buy_order_id` 字段
   - 导致卖出订单无法关联到对应的买入订单
   - 前端计算可卖出数量时,无法准确扣除已卖出的数量

2. **历史数据关联错误**
   - 早期创建的卖出订单没有保存 `buy_order_id` 关联
   - 有些卖出订单关联到已删除的买入订单
   - 导致前端计算时找不到正确的买入订单

## 修复方案

### 1. 添加数据库字段
执行脚本: `backend/add_buy_order_id_field.js`
- 在 `trade_orders` 表添加 `buy_order_id` 字段
- 创建索引以优化查询性能

### 2. 修改前端代码
修改文件: `src/store/useStore.js`

#### 保存订单时添加 `buy_order_id`
```javascript
const dbOrder = {
  trade_number: newOrder.tradeNumber,
  order_type: newOrder.type,
  symbol: newOrder.symbol,
  name: newOrder.name,
  price: newOrder.price,
  quantity: newOrder.quantity,
  stop_loss_price: newOrder.stopLossPrice,
  take_profit_price: newOrder.takeProfitPrice,
  psychological_score: newOrder.psychologicalScore,
  strategy_score: newOrder.strategyScore,
  risk_score: newOrder.riskScore,
  overall_score: newOrder.overallScore,
  order_date: new Date().toISOString().split('T')[0],
  order_time: new Date().toTimeString().split(' ')[0].slice(0, 5),
  status: 'completed',
  is_virtual: newOrder.isVirtual || false,
  buy_order_id: newOrder.buyOrderId || null,  // 新增
  notes: null,
  deleted: false,
  deleted_at: null
}
```

#### 从数据库加载订单时映射 `buy_order_id`
```javascript
const newOrders = orders
  .filter(o => !o.deleted)
  .map(o => ({
    id: o.id?.toString(),
    tradeNumber: o.trade_number || o.tradeNumber || o.id?.toString(),
    type: o.order_type || o.type,
    symbol: o.symbol,
    name: o.name,
    price: o.price,
    quantity: o.quantity,
    stopLossPrice: o.stop_loss_price || o.stopLossPrice,
    takeProfitPrice: o.take_profit_price || o.takeProfitPrice,
    psychologicalScore: o.psychological_score || o.psychologicalScore,
    strategyScore: o.strategy_score || o.strategyScore,
    riskScore: o.risk_score || o.riskScore,
    overallScore: o.overall_score || o.overallScore,
    createdAt: o.created_at || o.createdAt || new Date().toISOString(),
    deleted: o.deleted || false,
    deletedAt: o.deleted_at || o.deletedAt || null,
    status: o.status,
    isVirtual: o.is_virtual || o.isVirtual,
    buyOrderId: o.buy_order_id || o.buyOrderId || null,  // 新增
    notes: o.notes
  }))
```

### 3. 修复历史数据
执行脚本: `backend/fix_buy_order_id.js`
- 找出所有关联到已删除买入订单的卖出订单
- 将它们重新关联到有效的买入订单

## 验证结果

### 修复前
```
交易编号 20260322005:
- 买入: 188300 (id=25, 未删除)
- 卖出: 188000 (id=31, 未删除)
- 买入订单 id=4 (已删除)
- 卖出订单 id=31 的 buy_order_id = 4 (已删除的买入订单)

前端计算:
- 找到买入订单 id=25, 数量 188300
- 查找 buyOrderId = 25 的卖出订单: 找不到
- 可卖出数量 = 188300 - 0 = 188300 ❌ (错误!)
```

### 修复后
```
交易编号 20260322005:
- 买入: 188300 (id=25, 未删除)
- 卖出: 188000 (id=31, 未删除)
- 卖出订单 id=31 的 buy_order_id = 25 (有效)

前端计算:
- 找到买入订单 id=25, 数量 188300
- 查找 buyOrderId = 25 的卖出订单: 找到 id=31, 数量 188000
- 可卖出数量 = 188300 - 188000 = 300 ✅ (正确!)
```

## 注意事项

1. **前端需要刷新页面**
   - 修改后需要刷新页面以重新从数据库同步数据
   - 确保前端能读取到正确的 `buy_order_id` 字段

2. **历史数据已修复**
   - 所有关联到已删除买入订单的卖出订单已重新关联
   - 可卖出数量现在计算正确

3. **新订单自动关联**
   - 新创建的卖出订单会自动关联到对应的买入订单
   - 系统会在添加订单时保存 `buy_order_id`

## 相关文件

- `backend/add_buy_order_id_field.js` - 添加数据库字段
- `backend/fix_buy_order_id.js` - 修复历史数据
- `backend/check_frontend_sync.js` - 验证数据同步
- `src/store/useStore.js` - 前端状态管理修改
