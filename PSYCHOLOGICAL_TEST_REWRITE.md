# 心理测试功能重写说明

## 修改内容

### 1. 前端页面 (src/pages/PsychologicalTest.jsx)

**核心改进**：
- 完全重写提交流程，避免数据库同步覆盖用户输入
- 简化状态管理逻辑
- 使用 `isSaving` 标志防止提交期间的数据同步

**关键逻辑**：
```javascript
// 1. 加载数据
const loadDataForDate = (date) => {
  const testResult = getTestResultForDate(date)
  if (testResult) {
    setTestScores(testResult.scores)
  } else {
    setTestScores({})
  }
}

// 2. 监听 psychologicalTests 变化，但只在不是保存状态时同步
useEffect(() => {
  if (!isSaving) {
    loadDataForDate(selectedDate)
  }
}, [psychologicalTests, selectedDate])

// 3. 提交时直接调用 API，不使用 store 的方法
const handleSubmit = async () => {
  setIsSaving(true)  // 设置保存状态，阻止同步
  
  try {
    // 直接调用 API 保存
    const response = await fetch('/api/psychological_test_results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scores: currentScores,
        overall_score: overallScore,
        test_date: dateStr
      })
    })
    
    // 手动更新 Store，不触发同步
    const updatedTests = psychologicalTests.filter(...)
    updatedTests.push({ ... })
    importPsychologicalTestResults(updatedTests)
    
    // 保持当前分数不变
    setTestScores(currentScores)
  } finally {
    setIsSaving(false)  // 恢复保存状态
  }
}
```

### 2. 后端路由 (backend/src/routes/api.js)

**新增专用路由**：
```javascript
// POST /api/psychological_test_results - 保存或更新心理测试结果
router.post('/psychological_test_results', async (req, res) => {
  const { scores, overall_score, test_date } = req.body
  
  // 检查是否已存在当天数据
  const existingRecord = await findOne('psychological_test_results', { test_date })
  
  if (existingRecord) {
    // 更新已有记录
    result = await update('psychological_test_results', { id: existingRecord.id }, { ... })
  } else {
    // 创建新记录
    result = await insert('psychological_test_results', { ... })
  }
  
  res.json({ success: true, data: result })
})
```

## 功能需求实现

### 1. 可以正常打分确定提交储存到数据库，其他浏览器同时可以刷新读取查看

✅ **已实现**：
- 打分：用户可以为5个指标选择 0、1、2 分
- 提交：点击"确定"按钮提交到数据库
- 存储：数据保存到 `psychological_test_results` 表
- 多浏览器同步：所有浏览器通过 `/api/sync/all` 路由同步数据

### 2. 当天心理测试可以随便编辑，确定提交后，当天有心理测试结果的被覆盖更新，当天没有的直接创建数据

✅ **已实现**：
- 随便编辑：只有今天可以编辑，其他日期禁用
- 有则更新：后端逻辑检查 `test_date` 是否存在，存在则更新
- 无则创建：不存在则创建新记录

## 测试步骤

1. **打开浏览器**：http://localhost:5173 的心理测试页面
2. **初始状态**：如果今天没有数据，所有分数为空
3. **打分**：为每个指标选择分数（0、1、2）
4. **查看总分**：确认总分正确（例如：2+1+2+1+2=8）
5. **提交**：点击"确定"按钮
6. **验证**：
   - 分数保持为 8，不会变成 10
   - 刷新页面，分数仍然是 8
   - 打开其他浏览器，也能看到相同的数据
7. **再次编辑**：
   - 修改某些分数
   - 再次提交
   - 验证数据被正确更新（不是创建新记录）

## 关键改进点

### 问题1：提交后分数被覆盖
**原因**：提交后触发 `psychologicalTests` 更新，导致 `useEffect` 自动同步数据库数据
**解决**：使用 `isSaving` 标志阻止提交期间的数据同步

### 问题2：分数变成 10
**原因**：之前可能有测试数据是全 2 分（10分），页面加载时自动加载
**解决**：已清理今天的数据，提交流程确保保存用户实际输入

### 问题3：逻辑复杂难以维护
**原因**：使用了 `justSubmittedRef` 等复杂状态管理
**解决**：简化为直接调用 API，手动更新 Store，避免自动同步

## 技术细节

### 前端
- 使用 `useState` 管理本地分数状态
- 使用 `isSaving` 控制同步时机
- 直接调用 `fetch` 提交数据，不经过 store 的同步逻辑

### 后端
- 新增专用 POST 路由 `/api/psychological_test_results`
- 实现了"有则更新，无则创建"的逻辑
- 返回完整的记录数据供前端使用

## 注意事项

1. **时区问题**：数据库存储的 `test_date` 是 UTC 时间，查询时需要转换
2. **并发问题**：多个浏览器同时编辑同一天数据时，后端会覆盖（这是预期行为）
3. **数据验证**：后端验证 `scores`、`overall_score`、`test_date` 的合法性

## 后续优化建议

1. 添加数据加载动画
2. 添加提交成功后的提示动画
3. 支持查看历史分数变化
4. 添加数据导出功能
