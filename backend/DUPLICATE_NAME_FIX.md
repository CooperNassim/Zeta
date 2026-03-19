# 策略名称重复提示优化说明

## 问题描述

交易策略的新增和编辑弹窗中,策略名称重复时使用的是Toast提示(弱提示),而不是红色文本框下方的错误提示组件。

## 修改目标

1. 移除Toast红色弱提示
2. 使用红色文本框下方的错误消息组件显示: "策略名称已存在"

## 修改内容

### 1. 添加 `formErrorMessage` State (`src/pages/TradingStrategy.jsx`)

**位置**: 第65行

**添加内容**:
```javascript
const [formErrorMessage, setFormErrorMessage] = useState({})
```

**用途**: 存储每个字段的错误消息文本

### 2. 修改 `handleSubmit` 函数 (`src/pages/TradingStrategy.jsx`)

**位置**: 第95-122行

**修改前**:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault()

  const errors = {}
  FIELDS.forEach(field => {
    if (field.readonly || field.key === 'creator' || field.hideInForm || field.key === 'id') {
      return
    }
    if (!formData[field.key] || formData[field.key].trim() === '') {
      errors[field.key] = true
    }
  })

  // 检查重复名称
  const existingRecord = strategyRecords.find(
    record => record.name === formData.name && (!isEditMode || record.id !== editingId)
  )
  if (existingRecord) {
    showToast('策略名称已存在', 'error')  // ❌ Toast弱提示
    errors.name = true
  }

  if (Object.keys(errors).length > 0) {
    setFormErrors(errors)
    return
  }
  // ...
}
```

**修改后**:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault()

  const errors = {}
  const errorMessages = {}  // ✅ 新增错误消息对象
  FIELDS.forEach(field => {
    if (field.readonly || field.key === 'creator' || field.hideInForm || field.key === 'id') {
      return
    }
    if (!formData[field.key] || formData[field.key].trim() === '') {
      errors[field.key] = true
    }
  })

  // 检查重复名称
  const existingRecord = strategyRecords.find(
    record => record.name === formData.name && (!isEditMode || record.id !== editingId)
  )
  if (existingRecord) {
    errors.name = true
    errorMessages.name = '策略名称已存在'  // ✅ 设置错误消息
  }

  if (Object.keys(errors).length > 0) {
    setFormErrors(errors)
    setFormErrorMessage(errorMessages)  // ✅ 设置错误消息state
    return
  }
  // ...
}
```

### 3. 清空错误消息 (`src/pages/TradingStrategy.jsx`)

#### 3.1 新增时清空
**位置**: 第677行

**修改前**:
```javascript
onAdd={() => {
  setIsEditMode(false)
  // ...
  setFormData(initialData)
  setFormErrors({})
  setShowModal(true)
}}
```

**修改后**:
```javascript
onAdd={() => {
  setIsEditMode(false)
  // ...
  setFormData(initialData)
  setFormErrors({})
  setFormErrorMessage({})  // ✅ 清空错误消息
  setShowModal(true)
}}
```

#### 3.2 编辑时清空
**位置**: 第155行

**修改前**:
```javascript
setFormData(initialData)
setFormErrors({})
setIsEditMode(true)
setEditingId(selectedIds[0])
setShowModal(true)
```

**修改后**:
```javascript
setFormData(initialData)
setFormErrors({})
setFormErrorMessage({})  // ✅ 清空错误消息
setIsEditMode(true)
setEditingId(selectedIds[0])
setShowModal(true)
```

#### 3.3 关闭弹窗时清空
**位置**: 第161-171行

**修改前**:
```javascript
const handleModalClose = () => {
  setShowModal(false)
  setIsEditMode(false)
  setEditingId(null)
  setFormErrors({})
  // ...
}
```

**修改后**:
```javascript
const handleModalClose = () => {
  setShowModal(false)
  setIsEditMode(false)
  setEditingId(null)
  setFormErrors({})
  setFormErrorMessage({})  // ✅ 清空错误消息
  // ...
}
```

### 4. 修改 `DataForm` 组件 (`src/components/DataForm.jsx`)

**位置**: 第7行, 第93行

**修改1 - 添加参数**:
```javascript
const DataForm = ({
  fields,
  formData,
  formErrors,
  formErrorMessage,  // ✅ 新增参数
  onChange,
  getFieldComponent
}) => {
```

**修改2 - 显示错误消息**:
```javascript
// 修改前
{!field.notRequired && !field.readonly && formErrors[field.key] && (
  <ErrorMessage message={typeof formErrors[field.key] === 'string' ? formErrors[field.key] : '不能为空'} />
)}

// 修改后
{!field.notRequired && !field.readonly && formErrors[field.key] && (
  <ErrorMessage message={formErrorMessage?.[field.key] || '不能为空'} />
)}
```

### 5. 修改 `FormModal` 组件 (`src/components/FormModal.jsx`)

**位置**: 第6行, 第52-58行

**修改1 - 添加参数**:
```javascript
const FormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  fields,
  formData,
  formErrors,
  formErrorMessage,  // ✅ 新增参数
  onFormDataChange,
  getFieldComponent,
  width
}) => {
```

**修改2 - 传递给DataForm**:
```javascript
<DataForm
  fields={fields}
  formData={formData}
  formErrors={formErrors}
  formErrorMessage={formErrorMessage}  // ✅ 传递错误消息
  onChange={handleChange}
  getFieldComponent={getFieldComponent}
/>
```

### 6. 更新 FormModal 调用 (`src/pages/TradingStrategy.jsx`)

**位置**: 第796-809行

**修改前**:
```javascript
<FormModal
  isOpen={showModal}
  onClose={handleModalClose}
  onSubmit={handleSubmit}
  title={isEditMode ? "编辑" : "新增"}
  fields={FIELDS}
  formData={formData}
  formErrors={formErrors}
  onFormDataChange={(newFormData, clearError) => {
    setFormData(newFormData)
    if (clearError) {
      setFormErrors(prev => ({ ...prev, ...clearError }))
    }
  }}
/>
```

**修改后**:
```javascript
<FormModal
  isOpen={showModal}
  onClose={handleModalClose}
  onSubmit={handleSubmit}
  title={isEditMode ? "编辑" : "新增"}
  fields={FIELDS}
  formData={formData}
  formErrors={formErrors}
  formErrorMessage={formErrorMessage}  // ✅ 传递错误消息
  onFormDataChange={(newFormData, clearError) => {
    setFormData(newFormData)
    if (clearError) {
      setFormErrors(prev => ({ ...prev, ...clearError }))
    }
  }}
/>
```

## 功能说明

### 错误提示类型

1. **必填字段为空**: 显示 "不能为空"
2. **策略名称重复**: 显示 "策略名称已存在"
3. **其他自定义错误**: 可扩展添加

### 错误显示位置

- ✅ 红色文本框下方
- ✅ 与必填字段验证共用一个组件 (`ErrorMessage`)
- ✅ 样式一致: 红色小字,简洁明了

### 错误清除时机

- 打开新增弹窗时
- 打开编辑弹窗时
- 关闭弹窗时
- 修改字段内容时

## 用户体验改进

### 修改前
- ❌ 使用Toast弹窗提示,容易被忽略
- ❌ 弹窗会遮挡表单,用户需要关闭后才能继续编辑
- ❌ 弱提示,用户可能不知道具体哪个字段有问题

### 修改后
- ✅ 错误信息直接显示在字段下方
- ✅ 红色醒目,一目了然
- ✅ 不遮挡表单,用户可以直接修改
- ✅ 与其他必填字段提示风格一致

## 测试场景

### 1. 新增策略 - 名称重复
1. 点击"新增"按钮
2. 输入已存在的策略名称
3. 点击"保存"
4. **预期**: 策略名称输入框下方显示红色错误消息 "策略名称已存在"

### 2. 编辑策略 - 名称重复
1. 选择一条记录,点击"编辑"
2. 修改策略名称为已存在的名称
3. 点击"保存"
4. **预期**: 策略名称输入框下方显示红色错误消息 "策略名称已存在"

### 3. 修改后保存
1. 发生名称重复错误后
2. 修改为不重复的名称
3. 再次点击"保存"
4. **预期**: 错误消失,保存成功

### 4. 必填字段为空
1. 点击"新增"
2. 清空必填字段
3. 点击"保存"
4. **预期**: 对应字段下方显示红色错误消息 "不能为空"

## 总结

✅ 移除了Toast红色弱提示
✅ 使用红色文本框下方的错误消息组件
✅ 错误消息清晰明确: "策略名称已存在"
✅ 与必填字段验证风格统一
✅ 改善了用户体验,错误提示更直观
