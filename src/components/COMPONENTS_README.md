# 公共组件使用说明

## 组件列表

### 1. CustomDatePicker - 自定义日期选择器

用于选择日期的组件。

```jsx
import CustomDatePicker from './components/CustomDatePicker'

<CustomDatePicker
  value={dateValue}
  onChange={(date) => setDate(date)}
  placeholder="请选择日期"
  className="w-full"
/>
```

**Props:**
- `value`: 当前选中的日期 (string)
- `onChange`: 日期变化回调 (date: string) => void
- `placeholder`: 占位文本，默认"日期"
- `className`: 自定义样式类名

---

### 2. CustomSelect - 自定义下拉选择框

带自定义样式的下拉选择框。

```jsx
import CustomSelect from './components/CustomSelect'

<CustomSelect
  value={selectedValue}
  onChange={(value) => setSelectedValue(value)}
  options={[
    { value: 'option1', label: '选项1' },
    { value: 'option2', label: '选项2' }
  ]}
  placeholder="请选择"
  error={hasError}
/>
```

**Props:**
- `value`: 当前选中的值
- `onChange`: 值变化回调
- `options`: 选项数组 `[{ value, label }]`
- `placeholder`: 占位文本，默认"请选择"
- `className`: 自定义样式类名
- `error`: 是否有错误，显示红色边框

---

### 3. CustomInput - 自定义输入框

带验证样式的输入框。

```jsx
import CustomInput from './components/CustomInput'

<CustomInput
  value={inputValue}
  onChange={(value) => setInputValue(value)}
  placeholder="请输入"
  type="text"
  error={hasError}
/>
```

**Props:**
- `value`: 输入值
- `onChange`: 值变化回调
- `placeholder`: 占位文本，默认"请输入"
- `type`: 输入类型，默认"text"
- `error`: 是否有错误，显示红色边框
- `className`: 自定义样式类名

---

### 4. Pagination - 分页器

数据表格的分页组件。

```jsx
import Pagination from './components/Pagination'

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={(page) => setCurrentPage(page)}
  selectedCount={selectedIds.length}
  totalCount={filteredData.length}
/>
```

**Props:**
- `currentPage`: 当前页码
- `totalPages`: 总页数
- `onPageChange`: 页码变化回调 (page: number) => void
- `selectedCount`: 已选中的条数
- `totalCount`: 总条数

---

### 5. EmptyState - 空状态

数据为空时显示的空状态组件。

```jsx
import EmptyState from './components/EmptyState'

<EmptyState
  message="暂无数据"
  icon={<CustomIcon />}
  height="400px"
/>
```

**Props:**
- `message`: 显示的消息，默认"暂无数据"
- `icon`: 自定义图标组件 (可选)
- `height`: 容器高度，默认"calc(100vh - 52px - 10px - 80px - 10px - 50px - 100px)"

---

### 6. DataTable - 数据表格

带选择功能的数据表格组件。

```jsx
import DataTable from './components/DataTable'
import EmptyState from './components/EmptyState'

<DataTable
  fields={FIELDS}
  data={paginatedData}
  selectedIds={selectedIds}
  onSelectAll={(ids) => setSelectedIds(ids)}
  onSelectOne={(id, checked) => handleSelect(id, checked)}
  emptyStateProps={{
    Component: EmptyState,
    props: { message: '暂无数据' }
  }}
/>
```

**Props:**
- `fields`: 字段定义数组 `[{ key, label, ... }]`
- `data`: 表格数据数组
- `selectedIds`: 已选中的 ID 数组
- `onSelectAll`: 全选回调
- `onSelectOne`: 单选回调
- `emptyStateProps`: 空状态配置 `{ Component, props }`

---

### 7. Toolbar - 工具栏

包含新增、编辑、导入、导出、删除等操作按钮的工具栏。

```jsx
import Toolbar from './components/Toolbar'

<Toolbar
  onAdd={() => setShowModal(true)}
  onEdit={() => handleEdit()}
  onImport={() => setShowImportModal(true)}
  onExport={() => handleExport()}
  onDelete={() => setShowDeleteModal(true)}
  canEdit={selectedIds.length === 1}
  canExport={filteredData.length > 0}
  canDelete={selectedIds.length > 0}
  totalCount={filteredData.length}
/>
```

**Props:**
- `onAdd`: 新增按钮点击回调
- `onEdit`: 编辑按钮点击回调
- `onImport`: 导入按钮点击回调
- `onExport`: 导出按钮点击回调
- `onDelete`: 删除按钮点击回调
- `canEdit`: 是否可以编辑 (编辑按钮是否禁用)
- `canExport`: 是否可以导出 (导出按钮是否禁用)
- `canDelete`: 是否可以删除 (删除按钮是否禁用)
- `totalCount`: 数据总条数

---

### 8. DataForm - 数据表单

动态生成的表单组件。

```jsx
import DataForm from './components/DataForm'

<DataForm
  fields={FIELDS}
  formData={formData}
  formErrors={formErrors}
  onChange={(newFormData, clearError) => {
    setFormData(newFormData)
    if (clearError) {
      setFormErrors(prev => ({ ...prev, ...clearError }))
    }
  }}
  getFieldComponent={(field, formData, formErrors, onChange) => {
    // 自定义字段渲染逻辑
    if (field.key === 'special') {
      return <CustomSpecialField {...props} />
    }
  }}
/>
```

**Props:**
- `fields`: 字段定义数组
- `formData`: 表单数据对象
- `formErrors`: 表单错误对象
- `onChange`: 数据变化回调
- `getFieldComponent`: 自定义字段渲染函数 (可选)

**字段定义示例:**
```js
const FIELDS = [
  { key: 'date', label: '日期', type: 'date' },
  { key: 'status', label: '状态', type: 'select', options: [
    { value: 'option1', label: '选项1' },
    { value: 'option2', label: '选项2' }
  ]},
  { key: 'name', label: '名称', type: 'text' }
]
```

---

### 9. ImportModal - 导入弹窗

文件导入功能的弹窗组件。

```jsx
import ImportModal from './components/ImportModal'

<ImportModal
  isOpen={showImportModal}
  onClose={() => {
    setShowImportModal(false)
    setImportResult(null)
    setErrorWorkbook(null)
    setImportFile(null)
    setImportFileError(false)
  }}
  onConfirm={handleConfirmImport}
  onDownloadTemplate={handleDownloadTemplate}
  onDownloadError={handleDownloadErrorFile}
  importFile={importFile}
  onFileChange={handleFileChange}
  importResult={importResult}
  importFileError={importFileError}
  errorWorkbook={errorWorkbook}
/>
```

**Props:**
- `isOpen`: 是否显示弹窗
- `onClose`: 关闭弹窗回调
- `onConfirm`: 确认导入回调
- `onDownloadTemplate`: 下载模板回调
- `onDownloadError`: 下载错误文件回调
- `importFile`: 当前选择的文件
- `onFileChange`: 文件选择回调
- `importResult`: 导入结果对象 `{ success, successCount, errorCount, totalCount }`
- `importFileError`: 是否有文件选择错误
- `errorWorkbook`: 错误工作簿对象 (用于下载)

---

### 10. ExportModal - 导出弹窗

数据导出功能的弹窗组件。

```jsx
import ExportModal from './components/ExportModal'

<ExportModal
  isOpen={showExportModal}
  onClose={() => setShowExportModal(false)}
  onConfirm={handleConfirmExport}
  exportFormat={exportFormat}
  onFormatChange={(format) => setExportFormat(format)}
  totalCount={filteredData.length}
/>
```

**Props:**
- `isOpen`: 是否显示弹窗
- `onClose`: 关闭弹窗回调
- `onConfirm`: 确认导出回调
- `exportFormat`: 导出格式 "xlsx" | "csv"
- `onFormatChange`: 格式变化回调
- `totalCount`: 导出数据总条数

---

### 11. ConfirmModal - 确认弹窗

通用的确认弹窗组件。

```jsx
import ConfirmModal from './components/ConfirmModal'

<ConfirmModal
  isOpen={showDeleteModal}
  onClose={() => setShowDeleteModal(false)}
  onConfirm={() => {
    deleteSelected()
    setShowDeleteModal(false)
  }}
  title="删除"
  message="是否确认删除选中的数据？"
/>
```

**Props:**
- `isOpen`: 是否显示弹窗
- `onClose`: 关闭弹窗回调
- `onConfirm`: 确认回调
- `title`: 弹窗标题，默认"确认"
- `message`: 确认消息，默认"是否确认？"

---

### 12. FormModal - 表单弹窗

包含表单的弹窗组件，用于新增和编辑。

```jsx
import FormModal from './components/FormModal'

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
  getFieldComponent={(field, formData, formErrors, onChange) => {
    // 自定义字段渲染逻辑
  }}
/>
```

**Props:**
- `isOpen`: 是否显示弹窗
- `onClose`: 关闭弹窗回调
- `onSubmit`: 表单提交回调
- `title`: 弹窗标题
- `fields`: 字段定义数组
- `formData`: 表单数据对象
- `formErrors`: 表单错误对象
- `onFormDataChange`: 表单数据变化回调
- `getFieldComponent`: 自定义字段渲染函数 (可选)

---

## 完整示例

```jsx
import React, { useState } from 'react'
import Toolbar from './components/Toolbar'
import DataTable from './components/DataTable'
import Pagination from './components/Pagination'
import FormModal from './components/FormModal'
import ImportModal from './components/ImportModal'
import ExportModal from './components/ExportModal'
import ConfirmModal from './components/ConfirmModal'
import EmptyState from './components/EmptyState'

const MyPage = () => {
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState({})
  const [formErrors, setFormErrors] = useState({})

  const FIELDS = [
    { key: 'name', label: '名称', type: 'text' },
    { key: 'status', label: '状态', type: 'select', options: [...] },
    { key: 'date', label: '日期', type: 'date' }
  ]

  const data = [...] // 你的数据
  const filteredData = [...] // 过滤后的数据
  const pageSize = 20
  const totalPages = Math.ceil(filteredData.length / pageSize)
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <>
      <Toolbar
        onAdd={() => setShowModal(true)}
        onEdit={() => {/* 编辑逻辑 */}}
        onImport={() => setShowImportModal(true)}
        onExport={() => setShowExportModal(true)}
        onDelete={() => setShowDeleteModal(true)}
        canEdit={selectedIds.length === 1}
        canExport={filteredData.length > 0}
        canDelete={selectedIds.length > 0}
        totalCount={filteredData.length}
      />

      <DataTable
        fields={FIELDS}
        data={paginatedData}
        selectedIds={selectedIds}
        onSelectAll={(ids) => setSelectedIds(ids)}
        onSelectOne={(id, checked) => {
          if (checked) {
            setSelectedIds([...selectedIds, id])
          } else {
            setSelectedIds(selectedIds.filter(sid => sid !== id))
          }
        }}
        emptyStateProps={{
          Component: EmptyState,
          props: { message: '暂无数据' }
        }}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        selectedCount={selectedIds.length}
        totalCount={filteredData.length}
      />

      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={(e) => {
          e.preventDefault()
          // 提交逻辑
        }}
        title="新增"
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

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onConfirm={() => {/* 导入逻辑 */}}
        onDownloadTemplate={() => {/* 下载模板 */}}
        onDownloadError={() => {/* 下载错误 */}}
        importFile={importFile}
        onFileChange={(e) => {/* 文件选择 */}}
        importResult={importResult}
        importFileError={importFileError}
        errorWorkbook={errorWorkbook}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onConfirm={() => {/* 导出逻辑 */}}
        exportFormat={exportFormat}
        onFormatChange={(format) => setExportFormat(format)}
        totalCount={filteredData.length}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          // 删除逻辑
          setShowDeleteModal(false)
        }}
        title="删除"
        message="是否确认删除选中的数据？"
      />
    </>
  )
}
```
