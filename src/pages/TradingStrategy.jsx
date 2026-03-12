import React, { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import { format } from 'date-fns'
import ExcelJS from 'exceljs'
import { useToast } from '../contexts/ToastContext'
import DateRangePicker from '../components/DateRangePicker'
import FilterSelect from '../components/FilterSelect'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import DataTable from '../components/DataTable'
import Toolbar from '../components/Toolbar'
import DataForm from '../components/DataForm'
import ImportModal from '../components/ImportModal'
import ExportModal from '../components/ExportModal'
import ConfirmModal from '../components/ConfirmModal'
import FormModal from '../components/FormModal'

// 字段定义
const FIELDS = [
  { key: '_id', label: '修订版本', type: 'text', width: '80px' }, // 显示用的修订版本字段
  { key: 'id', label: 'ID', type: 'text', hideInForm: true, hideInTable: true }, // 隐藏的唯一ID字段

  {
    key: 'strategyType',
    label: '策略类型',
    type: 'select',
    options: [
      { value: '买入', label: '买入' },
      { value: '卖出', label: '卖出' }
    ],
    width: '100px'
  },
  { key: 'name', label: '策略名称', type: 'text' },
  { key: 'evalStandard1', label: '评估标准Ⅰ', type: 'text', placeholder: '指标：0=xx；1=xx；2=xx；' },
  { key: 'evalStandard2', label: '评估标准Ⅱ', type: 'text', placeholder: '指标：0=xx；1=xx；2=xx；' },
  { key: 'evalStandard3', label: '评估标准Ⅲ', type: 'text', placeholder: '指标：0=xx；1=xx；2=xx；' },
  { key: 'evalStandard4', label: '评估标准Ⅳ', type: 'text', placeholder: '指标：0=xx；1=xx；2=xx；' },
  { key: 'evalStandard5', label: '评估标准Ⅴ', type: 'text', placeholder: '指标：0=xx；1=xx；2=xx；' },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { value: '启用', label: '启用' },
      { value: '停用', label: '停用' }
    ],
    notRequired: true  // 弹窗中不显示
  },
  { key: 'updatedAt', label: '更新时间', type: 'text', readonly: true, notRequired: true, hideInForm: true, width: '160px' },
  { key: 'createdAt', label: '创建时间', type: 'text', readonly: true, notRequired: true, hideInForm: true, width: '160px' }
]

// 技术指标字段配置
const TradingStrategy = () => {
  const { showToast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showEnableModal, setShowEnableModal] = useState(false)
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({})
  const [formErrors, setFormErrors] = useState({})
  const [selectedIds, setSelectedIds] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [importResult, setImportResult] = useState(null)
  const [errorWorkbook, setErrorWorkbook] = useState(null)
  const [exportFormat, setExportFormat] = useState('xlsx')
  const [importFile, setImportFile] = useState(null)
  const [importFileError, setImportFileError] = useState(false)
  const [filterDateRange, setFilterDateRange] = useState('')
  const [filterStrategyType, setFilterStrategyType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterName, setFilterName] = useState('')
  const pageSize = 20

  const strategyRecords = useStore(state => state.strategyRecords)
  const addStrategyRecord = useStore(state => state.addStrategyRecord)
  const deleteStrategyRecord = useStore(state => state.deleteStrategyRecord)
  const deleteMultipleStrategyRecords = useStore(state => state.deleteMultipleStrategyRecords)
  const importStrategyRecords = useStore(state => state.importStrategyRecords)
  const updateStrategyRecord = useStore(state => state.updateStrategyRecord)

  useEffect(() => {
    const initialData = {}
    FIELDS.forEach(field => {
      initialData[field.key] = ''
    })
    setFormData(initialData)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()

    const errors = {}
    FIELDS.forEach(field => {
      // 跳过创建人字段、只读字段、隐藏字段和id字段
      if (field.readonly || field.key === 'creator' || field.hideInForm || field.key === 'id') {
        return
      }
      if (!formData[field.key] || formData[field.key].trim() === '') {
        errors[field.key] = true
      }
    })

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    // 计算总分
    let totalScore = 0
    const submitData = {
      ...formData,
      // 自动设置创建人
      creator: formData.creator || '系统'
    }

    if (isEditMode && editingId) {
      updateStrategyRecord(editingId, submitData)
      showToast('更新成功')
    } else {
      addStrategyRecord(submitData)
      showToast('保存成功')
    }

    handleModalClose()
  }

  const handleEdit = () => {
    if (selectedIds.length !== 1) return

    const editingData = strategyRecords.find(d => d.id === selectedIds[0])
    if (!editingData) return

    const initialData = {}
    FIELDS.forEach(field => {
      initialData[field.key] = editingData[field.key] || ''
    })
    setFormData(initialData)
    setFormErrors({})
    setIsEditMode(true)
    setEditingId(selectedIds[0])
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setIsEditMode(false)
    setEditingId(null)
    setFormErrors({})
    // 重置表单数据
    const initialData = {}
    FIELDS.forEach(field => {
      initialData[field.key] = ''
    })
    setFormData(initialData)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setImportFile(file)
    if (file) {
      setImportFileError(false)
    }
  }

  const handleConfirmImport = () => {
    if (!importFile) {
      setImportFileError(true)
      return
    }

    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(data)

        const worksheet = workbook.worksheets[0]
        const jsonData = []

        worksheet.eachRow((row, rowNumber) => {
          const rowData = []
          row.eachCell((cell) => {
            rowData.push(cell.value)
          })
          jsonData.push(rowData)
        })

        if (jsonData.length < 2) {
          alert('文件格式不正确或没有数据')
          return
        }

        const headers = jsonData[0]

        const dataList = []
        const errorList = []

        const formatToYYYYMMDD = (value) => {
          if (!value) return value

          const trimmedValue = String(value).trim()

          if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
            return trimmedValue
          }

          const date = new Date(trimmedValue)
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
          }

          const match = trimmedValue.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/)
          if (match) {
            const year = parseInt(match[1])
            const month = String(parseInt(match[2])).padStart(2, '0')
            const day = String(parseInt(match[3])).padStart(2, '0')
            return `${year}-${month}-${day}`
          }

          const slashMatch = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
          if (slashMatch) {
            const year = parseInt(slashMatch[3])
            const month = String(parseInt(slashMatch[1])).padStart(2, '0')
            const day = String(parseInt(slashMatch[2])).padStart(2, '0')
            return `${year}-${month}-${day}`
          }

          const dashMatch = trimmedValue.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
          if (dashMatch) {
            const year = parseInt(dashMatch[3])
            const month = String(parseInt(dashMatch[1])).padStart(2, '0')
            const day = String(parseInt(dashMatch[2])).padStart(2, '0')
            return `${year}-${month}-${day}`
          }

          return trimmedValue
        }

        for (let i = 1; i < jsonData.length; i++) {
          const values = jsonData[i]
          const data = {}
          const errors = []

          headers.forEach((header, index) => {
            const field = FIELDS.find(f => f.label === header)
            if (field) {
              const value = values[index] !== undefined ? String(values[index]).trim() : ''
              data[field.key] = value

              if (!value && !field.notRequired) {
                errors.push(`[${field.label}]不能为空；`)
              }

              const validStrategyTypes = ['买入', '卖出']
              const validStatuses = ['启用', '停用']

              if (field.key === 'strategyType' && value && !validStrategyTypes.includes(value)) {
                errors.push('[策略类型]格式错误；')
              }

              if (field.key === 'status' && value && !validStatuses.includes(value)) {
                errors.push('[状态]格式错误；')
              }
            }
          })

          if (errors.length > 0) {
            errorList.push({
              rowIndex: i + 1,
              errors: errors.join(' ')
            })
          } else {
            // 导入时默认设置状态为"启用"
            data.status = '启用'
            dataList.push(data)
          }
        }

        let wb = null
        if (errorList.length > 0) {
          wb = new ExcelJS.Workbook()
          const errorWorksheet = wb.addWorksheet('导入错误')

          const errorHeaders = ['错误信息', ...headers]
          errorWorksheet.addRow(errorHeaders)

          const headerRow = errorWorksheet.getRow(1)
          headerRow.font = { bold: true }
          headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFE0E0' }
          }

          errorList.forEach(error => {
            const errorRow = [
              error.errors,
              ...(jsonData[error.rowIndex] || []).map(v => v !== undefined ? String(v) : '')
            ]
            errorWorksheet.addRow(errorRow)
          })
        }

        setImportResult({
          success: dataList.length > 0,
          successCount: dataList.length,
          errorCount: errorList.length,
          totalCount: dataList.length + errorList.length
        })
        setErrorWorkbook(wb)

        if (dataList.length > 0) {
          importStrategyRecords(dataList)
          if (errorList.length === 0) {
            showToast('导入成功')
            setShowImportModal(false)
            setImportResult(null)
            setImportFile(null)
            setImportFileError(false)
          }
        }
      } catch (error) {
        console.error('导入失败:', error)
        alert('导入失败：' + error.message)
      }
    }

    reader.onerror = () => {
      alert('文件读取失败，请重试')
    }

    reader.readAsArrayBuffer(importFile)
  }

  const handleDownloadErrorFile = async () => {
    if (errorWorkbook) {
      const buffer = await errorWorkbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `交易策略_导入错误_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('模板')

    // 导入模板只包含"新增"弹窗的字段（排除hideInForm、id和status字段）
    const importHeaders = FIELDS.filter(f => !f.hideInForm && f.key !== 'id' && f.key !== 'status').map(f => f.label)

    worksheet.columns = importHeaders.map(header => ({
      header: header,
      key: header,
      width: 20
    }))

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '交易策略_导入模板.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExport = () => {
    if (strategyRecords.length === 0) {
      alert('暂无数据可导出')
      return
    }
    setShowExportModal(true)
  }

  const handleConfirmExport = async () => {
    // 导出字段与列表字段顺序一致（排除hideInTable字段）
    const exportHeaders = FIELDS.filter(f => !f.hideInTable).map(f => f.label)

    const exportFields = FIELDS.filter(f => !f.hideInTable)

    const rows = filteredData.map(data =>
      exportFields.map(f => {
        if (f.key === 'createdAt' && data[f.key]) {
          return format(new Date(data[f.key]), 'yyyy-MM-dd HH:mm:ss')
        }
        if (f.key === 'updatedAt' && data[f.key]) {
          return format(new Date(data[f.key]), 'yyyy-MM-dd HH:mm:ss')
        }
        return data[f.key] || ''
      })
    )

    if (exportFormat === 'xlsx') {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('交易策略')

      worksheet.columns = exportHeaders.map(header => ({
        header: header,
        key: header,
        width: 20
      }))

      rows.forEach(row => {
        worksheet.addRow(row)
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `交易策略_${format(new Date(), 'yyyyMMdd')}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } else {
      const csvContent = [exportHeaders, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `交易策略_${format(new Date(), 'yyyyMMdd')}.csv`
      link.click()
    }

    showToast('导出成功')
    setShowExportModal(false)
  }

  const sortedData = [...strategyRecords].sort((a, b) => {
    const dateA = new Date(a.createdAt || '1970-01-01')
    const dateB = new Date(b.createdAt || '1970-01-01')
    return dateB - dateA
  })

  const filteredData = sortedData.filter(data => {
    // 过滤已删除的数据
    if (data.deleted) return false

    let matchDate = true
    let matchStrategyType = true
    let matchStatus = true
    let matchName = true

    if (filterDateRange) {
      const [start, end] = filterDateRange.split('~')
      const recordDate = new Date(data.createdAt)
      if (start && end) {
        matchDate = recordDate >= new Date(start) && recordDate <= new Date(end)
      } else if (start) {
        matchDate = recordDate >= new Date(start)
      }
    }

    if (filterStrategyType !== '') {
      matchStrategyType = data.strategyType === filterStrategyType
    }

    if (filterStatus !== '') {
      matchStatus = data.status === filterStatus
    }

    if (filterName !== '') {
      matchName = data.name && data.name.toLowerCase().includes(filterName.toLowerCase())
    }

    return matchDate && matchStrategyType && matchStatus && matchName
  })

  const totalPages = Math.ceil(filteredData.length / pageSize)
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSelectAll = (ids) => {
    setSelectedIds(ids)
  }

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(sid => sid !== id))
    }
  }

  const handleDelete = () => {
    if (selectedIds.length === 0) return
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    deleteMultipleStrategyRecords(selectedIds)
    setSelectedIds([])
    setShowDeleteModal(false)
    showToast(`删除成功`)
  }

  const handleEnable = () => {
    if (selectedIds.length === 0) return
    setShowEnableModal(true)
  }

  const confirmEnable = () => {
    selectedIds.forEach(id => {
      const record = strategyRecords.find(r => r.id === id)
      if (record) {
        updateStrategyRecord(id, { ...record, status: '启用' })
      }
    })
    setSelectedIds([])
    setShowEnableModal(false)
    showToast('启用成功')
  }

  const handleDisable = () => {
    if (selectedIds.length === 0) return
    setShowDisableModal(true)
  }

  const confirmDisable = () => {
    selectedIds.forEach(id => {
      const record = strategyRecords.find(r => r.id === id)
      if (record) {
        updateStrategyRecord(id, { ...record, status: '停用' })
      }
    })
    setSelectedIds([])
    setShowDisableModal(false)
    showToast('停用成功')
  }

  const directionOptions = [
    { value: '买入', label: '买入' },
    { value: '卖出', label: '卖出' }
  ]

  return (
    <>
      <style>{`
        input[type="file"]::-webkit-file-upload-button {
          background-color: #0F1419 !important;
        }
        input[type="file"]::file-selector-button {
          background-color: #0F1419 !important;
        }
      `}</style>
      <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '10px', paddingRight: '10px', position: 'relative' }}>
        {/* 筛选条件 */}
        <div style={{ flexShrink: 0, marginTop: '10px' }}>
          <div className="flex gap-4 items-center">
            <div style={{ position: 'relative', width: '240px' }}>
              <FilterSelect
                options={[
                  { value: '买入', label: '买入' },
                  { value: '卖出', label: '卖出' }
                ]}
                value={filterStrategyType}
                onChange={(value) => {
                  setFilterStrategyType(value)
                  setCurrentPage(1)
                }}
                placeholder="策略类型"
              />
            </div>
            <div style={{ position: 'relative', width: '240px' }}>
              <input
                type="text"
                placeholder="策略名称"
                value={filterName}
                onChange={(e) => {
                  setFilterName(e.target.value)
                  setCurrentPage(1)
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ position: 'relative', width: '240px' }}>
              <FilterSelect
                options={[
                  { value: '启用', label: '启用' },
                  { value: '停用', label: '停用' }
                ]}
                value={filterStatus}
                onChange={(value) => {
                  setFilterStatus(value)
                  setCurrentPage(1)
                }}
                placeholder="状态"
              />
            </div>
            <div style={{ position: 'relative', width: '240px' }}>
              <DateRangePicker
                value={filterDateRange}
                onChange={(value) => {
                  setFilterDateRange(value)
                  setCurrentPage(1)
                }}
                placeholder="创建时间"
              />
            </div>
          </div>
        </div>

        {/* 工具栏 */}
        <Toolbar
          onAdd={() => {
            setIsEditMode(false)
            // 初始化表单数据，修订版本默认为V1.0.0，状态默认为启用
            const initialData = {}
            FIELDS.forEach(field => {
              initialData[field.key] = ''
            })
            // 设置默认修订版本
            initialData._id = 'V1.0.0'
            // 生成唯一ID（当前数据量+1）
            const nextId = strategyRecords.length + 1
            initialData.id = nextId.toString()
            initialData.status = '启用'
            setFormData(initialData)
            setFormErrors({})
            setShowModal(true)
          }}
          onEdit={handleEdit}
          onEnable={handleEnable}
          onDisable={handleDisable}
          onImport={() => setShowImportModal(true)}
          onExport={handleExport}
          onDelete={handleDelete}
          canEdit={selectedIds.length === 1}
          canEnable={selectedIds.length > 0}
          canDisable={selectedIds.length > 0}
          canExport={filteredData.length > 0}
          canDelete={selectedIds.length > 0}
          totalCount={filteredData.length}
        />

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative', paddingBottom: '50px', zIndex: '1', background: 'rgb(249, 250, 251)' }}>
          <div className="overflow-y-auto overflow-x-auto" style={{ flex: 1, minHeight: 'calc(100vh - 52px - 10px - 80px - 10px - 50px - 4px)', maxHeight: 'calc(100vh - 52px - 10px - 80px - 10px - 50px - 4px)', position: 'relative', zIndex: '1' }}>
            <DataTable
              fields={FIELDS}
              data={paginatedData}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectOne={handleSelectOne}
              emptyStateProps={{
                Component: EmptyState,
                props: { message: '暂无数据' }
              }}
              renderCell={(field, item) => {
                if (field.key === 'updatedAt' && item[field.key]) {
                  return format(new Date(item[field.key]), 'yyyy-MM-dd HH:mm:ss')
                }
                if (field.key === 'createdAt' && item[field.key]) {
                  return format(new Date(item[field.key]), 'yyyy-MM-dd HH:mm:ss')
                }
                return null
              }}
            />
          </div>
        </div>

        {/* 分页器 */}
        <div style={{ position: 'absolute', right: '0', bottom: '0', height: '50px', zIndex: '10', width: '100%' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            selectedCount={selectedIds.length}
            totalCount={filteredData.length}
          />
        </div>
      </div>
    </div>

      {/* 导入弹窗 */}
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

      {/* 导出确认弹窗 */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onConfirm={handleConfirmExport}
        exportFormat={exportFormat}
        onFormatChange={(format) => setExportFormat(format)}
        totalCount={filteredData.length}
      />

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="删除"
        message={`确认删除${selectedIds.length}条数据吗？`}
      />

      {/* 启用确认弹窗 */}
      <ConfirmModal
        isOpen={showEnableModal}
        onClose={() => setShowEnableModal(false)}
        onConfirm={confirmEnable}
        title="启用"
        message="是否确认启用"
      />

      {/* 停用确认弹窗 */}
      <ConfirmModal
        isOpen={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onConfirm={confirmDisable}
        title="停用"
        message="是否确认停用"
      />

      {/* 添加/编辑记录弹窗 */}
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
      </>
  )
}

export default TradingStrategy
