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
  { key: 'date', label: '日期', type: 'date', required: true },
  { key: 'nasdaq', label: '纳斯达克', type: 'text', required: true },
  { key: 'ftse', label: '英国富时', type: 'text', required: true },
  { key: 'dax', label: '德国DAX', type: 'text', required: true },
  { key: 'n225', label: '日经N225', type: 'text', required: true },
  { key: 'hsi', label: '恒生指数', type: 'text', required: true },
  { key: 'bitcoin', label: '比特币', type: 'text', required: true },
  { key: 'eurusd', label: '欧元兑美元', type: 'text', required: true },
  { key: 'usdjpy', label: '美元兑日元', type: 'text', required: true },
  { key: 'usdcny', label: '美元兑人民币', type: 'text', required: true },
  { key: 'oil', label: '布伦特原油', type: 'text', required: true },
  { key: 'gold', label: '伦敦黄金', type: 'text', required: true },
  { key: 'bond', label: '国债指数', type: 'text', required: true },
  { key: 'consecutive', label: '昨日连板', type: 'text', required: true },
  { key: 'a50', label: '富时A50', type: 'text', required: true },
  { key: 'shIndex', label: '上证指数', type: 'text', required: true },
  { key: 'sh2dayPower', label: '上证2日强力(亿)', type: 'text', required: true },
  { key: 'sh13dayPower', label: '上证13日强力(亿)', type: 'text', required: true },
  { key: 'upCount', label: '大盘涨家', type: 'text', required: true },
  { key: 'limitUp', label: '涨停', type: 'text', required: true },
  { key: 'downCount', label: '大盘跌家', type: 'text', required: true },
  { key: 'limitDown', label: '跌停', type: 'text', required: true },
  { key: 'volume', label: '大盘成交(亿)', type: 'text', required: true },
  { 
    key: 'sentiment', 
    label: '大盘情绪', 
    type: 'select',
    required: true,
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
    required: true,
    options: [
      { value: '看涨', label: '看涨' },
      { value: '看跌', label: '看跌' }
    ]
  },
  { 
    key: 'tradeStatus', 
    label: '交易状态', 
    type: 'select',
    required: true,
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

  // 状态管理
  const dailyWorkData = useStore(state => state.dailyWorkData)
  const addDailyWorkData = useStore(state => state.addDailyWorkData)
  const deleteDailyWorkData = useStore(state => state.deleteDailyWorkData)
  const deleteMultipleDailyWorkData = useStore(state => state.deleteMultipleDailyWorkData)
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
      if (field.required && (!formData[field.key] || formData[field.key].trim() === '')) {
        errors[field.key] = '不能为空'
      }
    })

    // 检查日期是否重复(新增和编辑模式都检查)
    // 注意：需要检查所有数据，包括已删除的，因为数据库有唯一键约束
    if (formData.date) {
      const allData = useStore.getState().dailyWorkDataWithDeleted || dailyWorkData
      const dateExists = allData.some(data =>
        data.date === formData.date &&
        (isEditMode ? data.id !== editingId : true) // 编辑模式下排除当前记录
      )
      if (dateExists) {
        errors.date = '日期已存在（包括已删除的数据）'
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    // 提交数据
    const submitData = { ...formData }
    
    if (isEditMode && editingId) {
      updateDailyWorkData(editingId, submitData)
        .then(() => {
          showToast('更新成功')
          handleModalClose()
        })
        .catch(error => {
          console.error('更新失败:', error)
          showToast('更新失败，请重试')
        })
    } else {
      addDailyWorkData(submitData)
        .then(() => {
          showToast('保存成功')
          handleModalClose()
        })
        .catch(error => {
          console.error('保存失败:', error)
          showToast('保存失败，请重试')
        })
    }
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

  const handleEdit = () => {
    if (selectedIds.length !== 1) return
    
    const editingData = dailyWorkData.find(d => d.id === selectedIds[0])
    if (!editingData) return

    setFormData({ ...editingData })
    setIsEditMode(true)
    setEditingId(selectedIds[0])
    setShowModal(true)
  }

  const handleDelete = () => {
    if (selectedIds.length === 0) return
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      if (selectedIds.length === 1) {
        await deleteDailyWorkData(selectedIds[0])
      } else {
        await deleteMultipleDailyWorkData(selectedIds)
      }
      
      setSelectedIds([])
      setShowDeleteModal(false)
      showToast(`删除成功`)
    } catch (error) {
      console.error('[DailyWork] 删除出错:', error)
      showToast('删除失败,请重试')
    }
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

  const handleFileChange = (file) => {
    setImportFile(file)
    setImportFileError(false)
  }

  const handleConfirmImport = async () => {
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

        // 明确跳过第一行（表头行），从第二行开始读取数据
        const rows = worksheet.getRows(2, worksheet.rowCount ? worksheet.rowCount - 1 : 0)
        if (!rows || rows.length === 0) {
          alert('文件没有数据，请检查Excel文件格式')
          return
        }

        rows.forEach(row => {
          const rowData = []
          row.eachCell((cell, colNumber) => {
            // 只读取与FIELDS数量对应的列
            if (colNumber <= FIELDS.length) {
              rowData.push(cell.value)
            }
          })
          jsonData.push(rowData)
        })

        const dataList = []
        const errorList = []
        // 包含现有数据和当前批次已成功处理的数据
        const existingDates = new Set(dailyWorkData.map(d => d.date))
        // 用于跟踪当前批次中已处理的日期
        const currentBatchDates = new Set()

        // 定义有效的枚举值
        const validSentiments = ['冰点', '过冷', '微冷', '微热', '过热', '沸点']
        const validPredictions = ['看涨', '看跌']
        const validTradeStatuses = ['积极地', '保守地', '防御地']

        const formatToYYYYMMDD = (value) => {
          if (!value) return value
          
          const trimmedValue = String(value).trim()
          
          // 如果已经是正确的 YYYY-MM-DD 格式，直接返回
          if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
            return trimmedValue
          }
          
          // 检查是否为Excel序列号（纯数字）
          if (/^\d+$/.test(trimmedValue)) {
            const serialNumber = parseInt(trimmedValue, 10)
            // Excel序列号转日期：从1900年1月1日开始计算（注意Excel的bug：认为1900年是闰年）
            const excelEpoch = new Date('1900-01-01T00:00:00Z')
            // Excel序列号1对应1900-01-01，但由于Excel认为1900年是闰年，需要减去2天的修正
            const date = new Date(excelEpoch.getTime() + (serialNumber - 2) * 24 * 60 * 60 * 1000)
            
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear()
              const month = String(date.getMonth() + 1).padStart(2, '0')
              const day = String(date.getDate()).padStart(2, '0')
              return `${year}-${month}-${day}`
            }
          }
          
          // 尝试解析为Date对象（处理各种字符串格式如 YYYY/MM/DD, MM/DD/YYYY 等）
          const date = new Date(trimmedValue)
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
          }
          
          // 如果无法解析，返回原始值（后续会报格式错误）
          return trimmedValue
        }

        for (let i = 0; i < jsonData.length; i++) {
          const values = jsonData[i]
          
          // 检查是否为空行：所有单元格都为空或只包含空格
          const isRowEmpty = values.every(cell => {
            const cellValue = cell !== undefined ? String(cell).trim() : ''
            return cellValue === ''
          })
          
          if (isRowEmpty) {
            // 跳过空行，不进行任何处理
            continue
          }
          
          const data = {}
          const fieldErrors = {} // 记录每个字段的错误

          // 按照FIELDS数组的顺序处理每一列
          FIELDS.forEach((field, fieldIndex) => {
            const value = values[fieldIndex] !== undefined ? String(values[fieldIndex]).trim() : ''
            data[field.key] = value

            // 只有日期字段是必填的，其他字段允许为空
            if (field.key === 'date' && !value) {
              fieldErrors[field.key] = `[${field.label}]不能为空`
            }

            if (field.key === 'date' && value) {
              const formattedDate = formatToYYYYMMDD(value)
              
              const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(formattedDate)
              
              if (!isValidFormat) {
                fieldErrors[field.key] = `[${field.label}]格式错误，应为YYYY-MM-DD格式`
              } else {
                data[field.key] = formattedDate
                
                // 检查是否与现有数据或当前批次数据重复
                if (existingDates.has(data[field.key]) || currentBatchDates.has(data[field.key])) {
                  fieldErrors[field.key] = `[${field.label}]已存在`
                }
              }
            }

            if (field.key === 'sentiment' && value && !validSentiments.includes(value)) {
              fieldErrors[field.key] = `[${field.label}]格式错误，有效值：${validSentiments.join('、')}`
            }

            if (field.key === 'prediction' && value && !validPredictions.includes(value)) {
              fieldErrors[field.key] = `[${field.label}]格式错误，有效值：${validPredictions.join('、')}`
            }

            if (field.key === 'tradeStatus' && value && !validTradeStatuses.includes(value)) {
              fieldErrors[field.key] = `[${field.label}]格式错误，有效值：${validTradeStatuses.join('、')}`
            }
          })

          // 检查是否有任何字段错误
          const hasErrors = Object.keys(fieldErrors).length > 0
          
          if (hasErrors) {
            // 构建总的错误信息字符串
            const allErrors = Object.values(fieldErrors).join('；')
            errorList.push({
              rowIndex: i + 2, // Excel行号从1开始，加上表头行
              errors: allErrors,
              fieldErrors: fieldErrors // 保存详细的字段错误信息
            })
          } else {
            dataList.push(data)
            // 将成功处理的日期添加到当前批次集合中，用于后续重复检测
            currentBatchDates.add(data.date)
          }
        }

        let wb = null
        if (errorList.length > 0) {
          wb = new ExcelJS.Workbook()
          const errorWorksheet = wb.addWorksheet('导入错误')

          // 创建错误报告表头
          const errorHeaders = ['错误信息', ...FIELDS.map(f => f.label)]
          errorWorksheet.addRow(errorHeaders)

          const headerRow = errorWorksheet.getRow(1)
          headerRow.font = { bold: true }
          headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFE0E0' }
          }

          errorList.forEach(error => {
            const originalRow = jsonData[error.rowIndex - 2] || []
            
            const errorRow = [
              error.errors,
              ...originalRow.map(v => v !== undefined ? String(v) : '')
            ]
            errorWorksheet.addRow(errorRow)
          })
        }

        setErrorWorkbook(wb)

        // 设置导入结果（无论成功还是失败都显示在弹窗内）
        setImportResult({
          success: dataList.length > 0,
          successCount: dataList.length,
          errorCount: errorList.length,
          totalCount: dataList.length + errorList.length
        })

        if (dataList.length > 0) {
          // 使用 addDailyWorkData 逐个添加数据，但改为串行处理避免竞态条件
          try {
            // 串行处理所有数据
            for (const data of dataList) {
              await addDailyWorkData(data)
            }
            
            // 所有数据添加完成后，手动触发一次同步以确保数据一致性
            // 注意：addDailyWorkData 内部已经处理了同步，这里主要是确保最终状态正确
            
            if (errorList.length === 0) {
              showToast('导入成功')
            }
          } catch (error) {
            console.error('批量导入失败:', error)
            showToast('导入失败，请重试')
          }
        } else if (errorList.length > 0) {
          // 只有错误，没有成功数据

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

  // 筛选逻辑
  const filteredData = dailyWorkData.filter(data => {
    // 日期范围筛选
    if (filterDateRange) {
      const [startDate, endDate] = filterDateRange.split(' - ')
      if (startDate && data.date < startDate) return false
      if (endDate && data.date > endDate) return false
    }
    
    // 大盘情绪筛选
    if (filterSentiment !== '全部' && data.sentiment !== filterSentiment) {
      return false
    }
    
    return true
  })

  // 分页逻辑
  const totalPages = Math.ceil(filteredData.length / pageSize)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(paginatedData.map(item => item.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(itemId => itemId !== id))
    }
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
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '0px', paddingRight: '10px', position: 'relative' }}>
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
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative', paddingBottom: '50px', zIndex: '1', background: 'rgb(249, 250, 251)' }}>
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
            onPageChange={(page) => {
              setCurrentPage(page)
              setSelectedIds([])
            }}
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
        onFileChange={handleFileChange}
        importFile={importFile}
        importResult={importResult}
        importFileError={importFileError}
        errorWorkbook={errorWorkbook}
      />

      {/* 导出弹窗 */}
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