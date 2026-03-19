# 心理测试功能修复说明

## 问题分析

用户提交心理测试分数后,分数会自动变成 10 分,而不是用户实际输入的分数。

## 根本原因

1. **数据同步覆盖用户输入**: 提交数据后,数据库会触发 `sync` API 更新前端 Store 中的 `psychologicalTests`
2. **useEffect 自动触发**: 当 `psychologicalTests` 变化时,`useEffect` 会自动更新 `testScores` 状态
3. **分数被覆盖**: 数据库返回的 `overall_score` 可能是字符串 `'10.00'`,被前端处理后变成了 10

## 修复方案

### 1. 防止数据库同步覆盖用户输入 (PsychologicalTest.jsx)

```jsx
// 在 useEffect 中添加 isSaving 检查和分数比较
useEffect(() => {
  if (psychologicalTests.length > 0) {
    const currentTestResult = getTestResultForDate(selectedDate)
    
    // 只有当用户没有正在编辑时，才自动同步数据
    if (currentTestResult && !isSaving) {
      // 检查是否是提交刚刚完成（当前分数与数据库记录相同）
      const dbScoreSum = Object.values(currentTestResult.scores || {}).reduce((sum, val) => sum + (Number(val) || 0), 0)
      const localScoreSum = Object.values(testScores || {}).reduce((sum, val) => sum + (Number(val) || 0), 0)

      // 只有当分数不同时才同步
      if (dbScoreSum !== localScoreSum) {
        setTestScores(currentTestResult.scores)
      }
    } else if (!currentTestResult && !isSaving) {
      setTestScores({})
    }
  }
}, [psychologicalTests, selectedDate])
```

### 2. 简化提交逻辑

移除了冗余的错误处理,让 `addPsychologicalTest` 内部处理 23505 错误(重复日期)。

### 3. 确保分数为整数

- `calculateOverallScore()` 使用 `Math.round()` 返回整数
- 提交时使用 `Math.round(parseFloat(overallScore))`
- Store 中的分数映射使用 `Math.round(parseFloat(...))`

## 预期行为

1. **用户输入**: 5 个指标,每个 0-2 分
2. **总分计算**: 直接累加,0-10 分 (5 × 2 = 10)
3. **提交保存**: 分数保存到数据库,保持用户输入的值
4. **提交后**: 页面显示的分数保持为用户输入的值,不会变成 10

## 测试步骤

1. 打开心理测试页面
2. 对 5 个指标进行打分 (0, 1, 或 2)
3. 观察总分是否正确计算 (例如: 2+1+2+1+2 = 8)
4. 点击"确定"按钮提交
5. 确认分数保持为 8,不会变成 10
6. 刷新页面,确认分数仍然是 8

## 技术细节

### 数据流

```
用户点击打分按钮 → 更新 testScores 状态
                 → calculateOverallScore() 计算总分
                 → 点击"确定"提交
                 → addPsychologicalTest() / updatePsychologicalTest()
                 → 保存到数据库
                 → 触发 API sync 同步
                 → 更新 psychologicalTests
                 → useEffect 检测到变化
                 → isSaving=true 期间不覆盖
                 → isSaving=false 后,只有分数不同时才同步
```

### 分数类型

- **数据库**: `overall_score` 字段为字符串类型 `'10.00'`
- **前端**: `overallScore` 字段为整数类型 `10`
- **转换**: 使用 `Math.round(parseFloat(str))` 确保整数

### 关键变量

- `testScores`: 本地编辑状态,用户正在输入的分数
- `psychologicalTests`: Store 中的数据库同步数据
- `isSaving`: 提交保存时的加载状态,用于防止同步覆盖

## 相关文件

- `src/pages/PsychologicalTest.jsx`: 心理测试页面组件
- `src/store/useStore.js`: 全局状态管理
- `backend/src/database/queries.js`: 数据库查询
- `backend/src/routes/api.js`: API 路由
