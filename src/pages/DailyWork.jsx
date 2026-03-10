import React, { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import { format } from 'date-fns'
import ExcelJS from 'exceljs'
import { useToast } from '../contexts/ToastContext'
import DateRangePicker from '../components/DateRangePicker'
import CustomSelect from '../components/CustomSelect'
import FilterSelect from '../components/FilterSelect'
import CustomInput from '../components/CustomInput'
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
  { key: 'date', label: '日期', type: 'date' },
  { key: 'nasdaq', label: '纳斯达克', type: 'text' },
  { key: 'ftse', label: '英国富时', type: 'text' },
  { key: 'dax', label: '德国DAX', type: 'text' },
  { key: 'n225', label: '日经N225', type: 'text' },
  { key: 'hsi', label: '恒生指数', type: 'text' },
  { key: 'bitcoin', label: '比特币', type: 'text' },
  { key: 'eurusd', label: '欧元兑美元', type: 'text' },
  { key: 'usdjpy', label: '美元兑日元', type: 'text' },
  { key: 'usdcny', label: '美元兑人民币', type: 'text' },
  { key: 'oil', label: '布伦特原油', type: 'text' },
  { key: 'gold', label: '伦敦黄金', type: 'text' },
  { key: 'bond', label: '国债指数', type: 'text' },
  { key: 'consecutive', label: '昨日连板', type: 'text' },
  { key: 'a50', label: '富时A50', type: 'text' },
  { key: 'shIndex', label: '上证指数', type: 'text' },
  { key: 'sh2dayPower', label: '上证2日强力(亿)', type: 'text' },
  { key: 'sh13dayPower', label: '上证13日强力(亿)', type: 'text' },
  { key: 'upCount', label: '大盘涨家', type: 'text' },
  { key: 'limitUp', label: '涨停', type: 'text' },
  { key: 'downCount', label: '大盘跌家', type: 'text' },
  { key: 'limitDown', label: '跌停', type: 'text' },
  { key: 'volume', label: '大盘成交(亿)', type: 'text' },
  { 
    key: 'sentiment', 
    label: '大盘情绪', 
    type: 'select',
    options: [
      { value: '冰点', label: '冰点' },
      { value: '过冷', label: '过冷' },
      { value: '微冷', label: '微冷' },
      { value: '微热', label: '微热' },
      { value: '过热', label: '过热' },
      { value: '沸点', label: '沸点' }
    ]
  },
  { 
    key: 'prediction', 
    label: '预测当日', 
    type: 'select',
    options: [
      { value: '看涨', label: '看涨' },
      { value: '看跌', label: '看跌' }
    ]
  },
  { 
    key: 'tradeStatus', 
    label: '交易状态', 
    type: 'select',
    options: [
      { value: '积极地', label: '积极地' },
      { value: '保守地', label: '保守地' },
      { value: '防御地', label: '防御地' }
    ]
  }
]

const DailyWork = () => {
  const { showToast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
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
  const [filterSentiment, setFilterSentiment] = useState('全部')
  const pageSize = 20

  const dailyWorkData = useStore(state => state.dailyWorkData)
  const addDailyWorkData = useStore(state => state.addDailyWorkData)
  const deleteDailyWorkData = useStore(state => state.deleteDailyWorkData)
  const deleteMultipleDailyWorkData = useStore(state => state.deleteMultipleDailyWorkData)
  const importDailyWorkData = useStore(state => state.importDailyWorkData)
  const updateDailyWorkData = useStore(state => state.updateDailyWorkData)

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
      if (!formData[field.key] || formData[field.key].trim() === '') {
        errors[field.key] = true
      }
    })

    // 检查日期是否重复(新增和编辑模式都检查)
    if (formData.date) {
      const dateExists = dailyWorkData.some(data =>
        data.date === formData.date &&
        (isEditMode ? data.id !== editingId : true) // 编辑模式下排除当前记录
      )
      if (dateExists) {
        errors.date = '日期已存在'
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const submitData = { ...formData }

    if (isEditMode && editingId) {
      updateDailyWorkData(editingId, submitData)
      showToast('更新成功')
    } else {
      addDailyWorkData(submitData)
      showToast('保存成功')
    }

    handleModalClose()
  }

  const handleEdit = () => {
    if (selectedIds.length !== 1) return

    const editingData = dailyWorkData.find(d => d.id === selectedIds[0])
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
        const existingDates = new Set(dailyWorkData.map(d => d.date))

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

        const validSentiments = ['冰点', '过冷', '微冷', '微热', '过热', '沸点']
        const validPredictions = ['看涨', '看跌']
        const validTradeStatuses = ['积极地', '保守地', '防御地']

        for (let i = 1; i < jsonData.length; i++) {
          const values = jsonData[i]
          const data = {}
          const errors = []

          headers.forEach((header, index) => {
            const field = FIELDS.find(f => f.label === header)
            if (field) {
              const value = values[index] !== undefined ? String(values[index]).trim() : ''
              data[field.key] = value

              if (!value) {
                errors.push(`[${field.label}]不能为空；`)
              }

              if (field.key === 'date' && value) {
                const formattedDate = formatToYYYYMMDD(value)
                
                const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(formattedDate)
                
                if (!isValidFormat) {
                  errors.push('[日期]格式错误；')
                } else {
                  data[field.key] = formattedDate

                  if (existingDates.has(data[field.key])) {
                    errors.push('[日期]已存在；')
                  }
                }
              }

              if (field.key === 'sentiment' && value && !validSentiments.includes(value)) {
                errors.push('[大盘情绪]格式错误；')
              }

              if (field.key === 'prediction' && value && !validPredictions.includes(value)) {
                errors.push('[预测当日]格式错误；')
              }

              if (field.key === 'tradeStatus' && value && !validTradeStatuses.includes(value)) {
                errors.push('[交易状态]格式错误；')
              }
            }
          })

          if (errors.length > 0) {
            errorList.push({
              rowIndex: i + 1,
              errors: errors.join(' ')
            })
          } else {
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
          importDailyWorkData(dataList)
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
      a.download = `每日功课_导入错误_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('模板')
    
    const headers = FIELDS.map(f => f.label)
    worksheet.columns = headers.map(header => ({
      header: header,
      key: header,
      width: 20
    }))
    
    const dateColIndex = headers.findIndex(h => h === '日期')
    if (dateColIndex !== -1) {
      const dateColumn = worksheet.getColumn(dateColIndex + 1)
      dateColumn.numFmt = 'yyyy-mm-dd'
    }
    
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '每日功课_导入模板.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExport = () => {
    if (dailyWorkData.length === 0) {
      alert('暂无数据可导出')
      return
    }
    setShowExportModal(true)
  }

  const handleConfirmExport = async () => {
    const headers = FIELDS.map(f => f.label)
    const rows = filteredData.map(data =>
      FIELDS.map(f => data[f.key] || '')
    )

    if (exportFormat === 'xlsx') {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('每日功课')
      
      worksheet.columns = headers.map(header => ({
        header: header,
        key: header,
        width: 20
      }))
      
      rows.forEach(row => {
        worksheet.addRow(row)
      })
      
      const dateColIndex = headers.findIndex(h => h === '日期')
      if (dateColIndex !== -1) {
        const dateColumn = worksheet.getColumn(dateColIndex + 1)
        dateColumn.numFmt = 'yyyy-mm-dd'
      }

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `每日功课_${format(new Date(), 'yyyyMMdd')}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } else {
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `每日功课_${format(new Date(), 'yyyyMMdd')}.csv`
      link.click()
    }

    showToast('导出成功')
    setShowExportModal(false)
  }

  const sortedData = [...dailyWorkData].sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateB - dateA
  })

  const filteredData = sortedData.filter(data => {
    let matchDate = true
    let matchSentiment = true
    let matchDeleted = !data.deleted

    if (filterDateRange) {
      const [start, end] = filterDateRange.split('~')
      const recordDate = new Date(data.date)
      if (start && end) {
        matchDate = recordDate >= new Date(start) && recordDate <= new Date(end)
      } else if (start) {
        matchDate = recordDate >= new Date(start)
      }
    }

    if (filterSentiment !== '全部') {
      matchSentiment = data.sentiment === filterSentiment
    }

    return matchDate && matchSentiment && matchDeleted
  })

  const latestData = sortedData[0]

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
    // 获取选中的数据项（包含日期）
    const selectedItems = dailyWorkData.filter(d => selectedIds.includes(d.id))
    console.log('[DailyWork] 选中要删除的数据:', selectedItems.map(d => ({ id: d.id, date: d.date })))
    deleteMultipleDailyWorkData(selectedIds)
    setSelectedIds([])
    setShowDeleteModal(false)
    showToast(`删除成功`)
  }

  const sentimentOptions = [
    { value: '冰点', label: '冰点' },
    { value: '过冷', label: '过冷' },
    { value: '微冷', label: '微冷' },
    { value: '微热', label: '微热' },
    { value: '过热', label: '过热' },
    { value: '沸点', label: '沸点' }
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
              <DateRangePicker
                value={filterDateRange}
                onChange={(value) => {
                  setFilterDateRange(value)
                  setCurrentPage(1)
                }}
                placeholder="日期"
              />
            </div>
            <div style={{ position: 'relative', width: '240px' }}>
              <FilterSelect
                value={filterSentiment === '全部' ? '' : filterSentiment}
                onChange={(value) => {
                  setFilterSentiment(value === '' ? '全部' : value)
                  setCurrentPage(1)
                }}
                options={sentimentOptions}
                placeholder="大盘情绪"
              />
            </div>
          </div>
        </div>

        {/* 工具栏 */}
        <Toolbar
          onAdd={() => {
            setIsEditMode(false)
            setShowModal(true)
          }}
          onEdit={handleEdit}
          onImport={() => setShowImportModal(true)}
          onExport={handleExport}
          onDelete={handleDelete}
          canEdit={selectedIds.length === 1}
          canExport={filteredData.length > 0}
          canDelete={selectedIds.length > 0}
          totalCount={filteredData.length}
        />

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative', marginTop: '10px', paddingBottom: '50px', zIndex: '1', background: 'rgb(249, 250, 251)' }}>
          <div className="overflow-y-auto overflow-x-auto" style={{ flex: 1, minHeight: 0, position: 'relative', zIndex: '1' }}>
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

export default DailyWork
