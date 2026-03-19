# 交易策略表 API 使用说明

## 数据库结构

### trading_strategies 表

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | INTEGER(SERIAL) | **主键**,自动递增 (1, 2, 3...) |
| `_id` | VARCHAR(20) | **修订版本**,唯一约束 (V01.0.0, V02.0.0...) |
| `strategy_type` | VARCHAR(20) | 策略类型: '买入' \| '卖出' |
| `name` | VARCHAR(200) | 策略名称 |
| `eval_standard_1` | TEXT | 评估标准Ⅰ |
| `eval_standard_2` | TEXT | 评估标准Ⅱ |
| `eval_standard_3` | TEXT | 评估标准Ⅲ |
| `eval_standard_4` | TEXT | 评估标准Ⅳ |
| `eval_standard_5` | TEXT | 评估标准Ⅴ |
| `status` | VARCHAR(20) | 状态: '启用' \| '停用' |
| `deleted` | BOOLEAN | 软删除标记 |
| `deleted_at` | TIMESTAMPTZ | 删除时间 |
| `created_at` | TIMESTAMPTZ | 创建时间 |
| `updated_at` | TIMESTAMPTZ | 更新时间 |

## API 端点

### 1. 获取所有策略

```http
GET /api/trading_strategies
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "_id": "V01.0.0",
      "strategy_type": "买入",
      "name": "趋势突破策略",
      "eval_standard_1": "指标：0=突破阻力位；1=放量确认；2=回踩不破；",
      "status": "启用",
      "deleted": false,
      "created_at": "2026-03-06T10:00:00.000Z",
      "updated_at": "2026-03-06T10:00:00.000Z"
    }
  ]
}
```

### 2. 获取单个策略

**通过 ID (主键)**:
```http
GET /api/trading_strategies/1
```

**通过 _id (修订版本)**:
```http
GET /api/trading_strategies/V01.0.0
```

### 3. 创建策略

```http
POST /api/trading_strategies
Content-Type: application/json

{
  "strategy_type": "买入",
  "name": "新策略",
  "eval_standard_1": "评估标准1",
  "status": "启用"
}
```

**注意**: 创建时不需要提供 `id` 和 `_id`,系统会自动生成:
- `id` 会自动递增
- `_id` 默认为 'V1.0.0',可通过更新修改

### 4. 更新策略

**通过 ID 更新**:
```http
PUT /api/trading_strategies/1
Content-Type: application/json

{
  "_id": "V01.1.0",
  "name": "更新后的策略名称",
  "status": "启用"
}
```

**通过 _id 更新**:
```http
PUT /api/trading_strategies/V01.0.0
Content-Type: application/json

{
  "_id": "V01.1.0",
  "name": "更新后的策略名称"
}
```

**重要**: 后端会自动识别:
- 如果传入的是数字(如 `1`),通过 `id` 查询
- 如果传入的是修订版本格式(如 `V01.0.0`),先通过 `_id` 找到对应的 `id`,再更新

### 5. 删除策略 (软删除)

**通过 ID 删除**:
```http
DELETE /api/trading_strategies/1
```

**通过 _id 删除**:
```http
DELETE /api/trading_strategies/V01.0.0
```

## 前端使用示例

### React + Axios 示例

```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

// 1. 获取所有策略
export const getAllStrategies = async () => {
  const response = await axios.get(`${API_BASE}/trading_strategies`);
  return response.data.data;
};

// 2. 获取单个策略 (支持 id 或 _id)
export const getStrategy = async (identifier) => {
  const response = await axios.get(`${API_BASE}/trading_strategies/${identifier}`);
  return response.data.data;
};

// 使用示例:
// const strategy1 = await getStrategy(1);      // 通过 id
// const strategy2 = await getStrategy('V01.0.0'); // 通过 _id

// 3. 创建策略
export const createStrategy = async (strategyData) => {
  const response = await axios.post(`${API_BASE}/trading_strategies`, strategyData);
  return response.data.data;
};

// 4. 更新策略 (支持 id 或 _id)
export const updateStrategy = async (identifier, data) => {
  const response = await axios.put(`${API_BASE}/trading_strategies/${identifier}`, data);
  return response.data.data;
};

// 使用示例:
// await updateStrategy(1, { name: '新名称' });              // 通过 id
// await updateStrategy('V01.0.0', { _id: 'V01.1.0' });     // 通过 _id,更新修订版本

// 5. 删除策略 (支持 id 或 _id)
export const deleteStrategy = async (identifier) => {
  const response = await axios.delete(`${API_BASE}/trading_strategies/${identifier}`);
  return response.data.data;
};

// 6. 批量删除
export const bulkDeleteStrategies = async (ids) => {
  const response = await axios.post(`${API_BASE}/trading_strategies/bulk/delete`, {
    ids: ids
  });
  return response.data.data;
};
```

### 查询选项

可以使用查询参数过滤:

```http
GET /api/trading_strategies?where={"strategy_type":"买入"}&orderBy=id DESC&limit=10
```

**支持的参数**:
- `where`: JSON格式的WHERE条件
- `orderBy`: 排序字段和方向
- `limit`: 返回记录数
- `offset`: 跳过记录数
- `includeDeleted`: 是否包含已删除记录 (`true`/`false`)

**示例**:
```javascript
// 获取启用的买入策略
const enabledBuyStrategies = await axios.get(
  `${API_BASE}/trading_strategies`,
  {
    params: {
      where: JSON.stringify({
        strategy_type: '买入',
        status: '启用'
      }),
      orderBy: 'id DESC'
    }
  }
);
```

## 常见问题

### Q1: 主键和修订版本的区别?

**主键 (id)**:
- 数据库层面的唯一标识
- 自动递增的数字 (1, 2, 3...)
- 用于数据库关联和索引

**修订版本 (_id)**:
- 业务层面的版本标识
- 格式为 `Vxx.xx.xx` (如 V01.0.0)
- 用于标识策略的版本迭代
- 前端展示和用户识别更友好

### Q2: 为什么要保留 id 作为主键?

1. **数据完整性**: SERIAL类型确保唯一性
2. **性能优化**: 数字主键查询更快
3. **外键关联**: 其他表引用时更简单
4. **兼容性**: 避免大规模重构

### Q3: _id 如何更新?

```javascript
// 将策略从 V01.0.0 更新到 V01.1.0
await updateStrategy('V01.0.0', {
  _id: 'V01.1.0',
  name: '趋势突破策略(修订版)'
});
```

### Q4: _id 必须唯一吗?

是的,`_id` 字段有唯一约束。如果尝试创建重复的 `_id`,数据库会报错。

## 版本控制建议

建议的 `_id` 命名规则:
- 主版本号: 策略重大变更 (如评估标准完全重写)
  - V01 → V02
- 次版本号: 策略调整 (如新增评估标准)
  - V01.0 → V01.1
- 修订号: 小调整 (如文字描述修改)
  - V01.0.0 → V01.0.1

示例:
```
V01.0.0 - 初始版本
V01.1.0 - 新增第6个评估标准
V02.0.0 - 重写所有评估标准
V02.1.0 - 调整评分权重
```
