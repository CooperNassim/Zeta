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
  { key: 'id', label: '编号', type: 'text', readonly: true, notRequired: true },
  {
    key: 'direction',
    label: '策略方向',
    type: 'select',
    options: [
      { value: '买入', label: '买入' },
      { value: '卖出', label: '卖出' }
    ]
  },
  {
    key: 'strategyType',
    label: '策略类型',
    type: 'select',
    options: [
      { value: '趋势', label: '趋势' },
      { value: '震荡', label: '震荡' },
      { value: '突破', label: '突破' },
      { value: '回调', label: '回调' }
    ]
  },
  { key: 'name', label: '名称', type: 'text' },
  { key: 'description', label: '描述', type: 'textarea' },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { value: '启用', label: '启用' },
      { value: '禁用', label: '禁用' }
    ]
  },
  { key: 'creator', label: '创建人', type: 'text' },
  { key: 'updatedAt', label: '更新时间', type: 'text', readonly: true, notRequired: true },
  { key: 'createdAt', label: '创建时间', type: 'text', readonly: true, notRequired: true }
]

// 技术指标字段配置
const INDICATOR_FIELD_NAMES = [
  { key: 'indicator1', label: '指标1', name: '指标名称' },
  { key: 'indicator2', label: '指标2', name: '指标名称' },
  { key: 'indicator3', label: '指标3', name: '指标名称' },
  { key: 'indicator4', label: '指标4', name: '指标名称' },
  { key: 'indicator5', label: '指标5', name: '指标名称' }
]

const TradingStrategy = () => {
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
  const [filterDirection, setFilterDirection] = useState('全部')
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
    // 初始化技术指标字段
    INDICATOR_FIELD_NAMES.forEach(field => {
      initialData[field.key + 'Name'] = ''
      initialData[field.key + 'Desc'] = ''
      initialData[field.key + 'MinScore'] = ''
      initialData[field.key + 'MaxScore'] = ''
      initialData[field.key + 'Weight'] = ''
    })
    setFormData(initialData)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()

    const errors = {}
    FIELDS.forEach(field => {
      // 跳过只读字段、notRequired字段和创建人字段
      if (field.readonly || field.notRequired || field.key === 'creator') {
        return
      }
      if (!formData[field.key] || formData[field.key].trim() === '') {
        errors[field.key] = true
      }
    })

    // 验证技术指标字段
    INDICATOR_FIELD_NAMES.forEach(field => {
      const nameKey = field.key + 'Name'
      const descKey = field.key + 'Desc'
      const minScoreKey = field.key + 'MinScore'
      const maxScoreKey = field.key + 'MaxScore'
      const weightKey = field.key + 'Weight'

      // 验证指标名称
      if (!formData[nameKey] || formData[nameKey].trim() === '') {
        errors[nameKey] = true
      }
      // 验证评估标准
      if (!formData[descKey] || formData[descKey].trim() === '') {
        errors[descKey] = true
      }
      // 验证最小分值
      const minScore = parseInt(formData[minScoreKey])
      if (isNaN(minScore)) {
        errors[minScoreKey] = true
      }
      // 验证最大分值
      const maxScore = parseInt(formData[maxScoreKey])
      if (isNaN(maxScore)) {
        errors[maxScoreKey] = true
      }
      // 验证权重
      const weight = parseFloat(formData[weightKey])
      if (isNaN(weight) || weight <= 0) {
        errors[weightKey] = true
      }
      // 验证最大分值必须大于最小分值
      if (!isNaN(minScore) && !isNaN(maxScore) && minScore >= maxScore) {
        errors[maxScoreKey] = true
      }
    })

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    // 计算总分
    let totalScore = 0
    let totalWeight = 0
    INDICATOR_FIELDS.forEach(field => {
      const score = parseInt(formData[field.key])
      const normalizedScore = ((score - field.minScore) / (field.maxScore - field.minScore)) * 100
      totalScore += normalizedScore * field.weight
      totalWeight += field.weight
    })
    const overallScore = totalWeight > 0 ? (totalScore / totalWeight).toFixed(2) / 10 : 0

    const submitData = {
      ...formData,
      // 保存技术指标字段
      ...INDICATOR_FIELD_NAMES.reduce((acc, field) => {
        acc[field.key + 'Name'] = formData[field.key + 'Name']
        acc[field.key + 'Desc'] = formData[field.key + 'Desc']
        acc[field.key + 'MinScore'] = parseInt(formData[field.key + 'MinScore'])
        acc[field.key + 'MaxScore'] = parseInt(formData[field.key + 'MaxScore'])
        acc[field.key + 'Weight'] = parseFloat(formData[field.key + 'Weight'])
        return acc
      }, {}),
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
    // 加载技术指标字段
    INDICATOR_FIELD_NAMES.forEach(field => {
      initialData[field.key + 'Name'] = editingData[field.key + 'Name'] || ''
      initialData[field.key + 'Desc'] = editingData[field.key + 'Desc'] || ''
      initialData[field.key + 'MinScore'] = editingData[field.key + 'MinScore'] || ''
      initialData[field.key + 'MaxScore'] = editingData[field.key + 'MaxScore'] || ''
      initialData[field.key + 'Weight'] = editingData[field.key + 'Weight'] || ''
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
    // 重置技术指标字段
    INDICATOR_FIELD_NAMES.forEach(field => {
      initialData[field.key + 'Name'] = ''
      initialData[field.key + 'Desc'] = ''
      initialData[field.key + 'MinScore'] = ''
      initialData[field.key + 'MaxScore'] = ''
      initialData[field.key + 'Weight'] = ''
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

        const validDirections = ['买入', '卖出']
        const validStrategyTypes = ['趋势', '震荡', '突破', '回调']
        const validStatuses = ['启用', '禁用']

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

              if (field.key === 'createdAt' && value) {
                const formattedDate = formatToYYYYMMDD(value)

                const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(formattedDate)

                if (!isValidFormat) {
                  errors.push('[创建时间]格式错误；')
                } else {
                  data[field.key] = formattedDate
                }
              }

              if (field.key === 'direction' && value && !validDirections.includes(value)) {
                errors.push('[策略方向]格式错误；')
              }

              if (field.key === 'strategyType' && value && !validStrategyTypes.includes(value)) {
                errors.push('[策略类型]格式错误；')
              }

              if (field.key === 'status' && value && !validStatuses.includes(value)) {
                errors.push('[状态]格式错误；')
              }
            }
          })

          // 验证技术指标字段（导入时暂不处理自定义指标字段）
          INDICATOR_FIELD_NAMES.forEach(field => {
            const nameKey = field.key + 'Name'
            const descKey = field.key + 'Desc'
            const minScoreKey = field.key + 'MinScore'
            const maxScoreKey = field.key + 'MaxScore'
            const weightKey = field.key + 'Weight'

            // 查找对应的列索引
            const nameIndex = headers.findIndex(h => h === field.label + '名称')
            const descIndex = headers.findIndex(h => h === field.label + '评估标准')
            const minScoreIndex = headers.findIndex(h => h === field.label + '最小分值')
            const maxScoreIndex = headers.findIndex(h => h === field.label + '最大分值')
            const weightIndex = headers.findIndex(h => h === field.label + '权重')

            if (nameIndex !== -1) {
              const value = values[nameIndex]
              if (!value || String(value).trim() === '') {
                errors.push(`[${field.label}名称]不能为空；`)
              } else {
                data[nameKey] = String(value).trim()
              }
            }
            if (descIndex !== -1) {
              const value = values[descIndex]
              if (!value || String(value).trim() === '') {
                errors.push(`[${field.label}评估标准]不能为空；`)
              } else {
                data[descKey] = String(value).trim()
              }
            }
            if (minScoreIndex !== -1) {
              const value = values[minScoreIndex]
              const minScore = parseInt(value)
              if (isNaN(minScore)) {
                errors.push(`[${field.label}最小分值]格式错误；`)
              } else {
                data[minScoreKey] = minScore
              }
            }
            if (maxScoreIndex !== -1) {
              const value = values[maxScoreIndex]
              const maxScore = parseInt(value)
              if (isNaN(maxScore)) {
                errors.push(`[${field.label}最大分值]格式错误；`)
              } else {
                data[maxScoreKey] = maxScore
              }
            }
            if (weightIndex !== -1) {
              const value = values[weightIndex]
              const weight = parseFloat(value)
              if (isNaN(weight) || weight <= 0) {
                errors.push(`[${field.label}权重]格式错误；`)
              } else {
                data[weightKey] = weight
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
              ...jsonData[error.rowIndex].map(v => v !== undefined ? String(v) : '')
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

    const headers = FIELDS.map(f => f.label)
    const indicatorHeaders = INDICATOR_FIELD_NAMES.flatMap(f => [
      f.label + '名称',
      f.label + '评估标准',
      f.label + '最小分值',
      f.label + '最大分值',
      f.label + '权重'
    ])
    const allHeaders = [...headers, ...indicatorHeaders]

    worksheet.columns = allHeaders.map(header => ({
      header: header,
      key: header,
      width: 20
    }))

    const createdAtColIndex = allHeaders.findIndex(h => h === '创建时间')
    const updatedAtColIndex = allHeaders.findIndex(h => h === '更新时间')
    if (createdAtColIndex >= 0) {
      const createdAtColumn = worksheet.getColumn(createdAtColIndex + 1)
      createdAtColumn.numFmt = 'yyyy-mm-dd'
    }
    if (updatedAtColIndex >= 0) {
      const updatedAtColumn = worksheet.getColumn(updatedAtColIndex + 1)
      updatedAtColumn.numFmt = 'yyyy-mm-dd'
    }

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
    const headers = FIELDS.map(f => f.label)
    const indicatorHeaders = INDICATOR_FIELD_NAMES.flatMap(f => [
      f.label + '名称',
      f.label + '评估标准',
      f.label + '最小分值',
      f.label + '最大分值',
      f.label + '权重'
    ])
    const allHeaders = [...headers, ...indicatorHeaders]

    const rows = filteredData.map(data =>
      [...FIELDS.map(f => {
        if (f.key === 'createdAt' && data[f.key]) {
          return format(new Date(data[f.key]), 'yyyy-MM-dd')
        }
        if (f.key === 'updatedAt' && data[f.key]) {
          return format(new Date(data[f.key]), 'yyyy-MM-dd')
        }
        return data[f.key] || ''
      }), ...INDICATOR_FIELD_NAMES.flatMap(f => [
        data[f.key + 'Name'] || '',
        data[f.key + 'Desc'] || '',
        data[f.key + 'MinScore'] || '',
        data[f.key + 'MaxScore'] || '',
        data[f.key + 'Weight'] || ''
      ])]
    )

    if (exportFormat === 'xlsx') {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('交易策略')

      worksheet.columns = allHeaders.map(header => ({
        header: header,
        key: header,
        width: 20
      }))

      rows.forEach(row => {
        worksheet.addRow(row)
      })

      const createdAtColIndex = allHeaders.findIndex(h => h === '创建时间')
      const updatedAtColIndex = allHeaders.findIndex(h => h === '更新时间')
      if (createdAtColIndex >= 0) {
        const createdAtColumn = worksheet.getColumn(createdAtColIndex + 1)
        createdAtColumn.numFmt = 'yyyy-mm-dd'
      }
      if (updatedAtColIndex >= 0) {
        const updatedAtColumn = worksheet.getColumn(updatedAtColIndex + 1)
        updatedAtColumn.numFmt = 'yyyy-mm-dd'
      }

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
      const csvContent = [allHeaders, ...rows].map(row => row.join(',')).join('\n')
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
    let matchDate = true
    let matchDirection = true

    if (filterDateRange) {
      const [start, end] = filterDateRange.split('~')
      const recordDate = new Date(data.createdAt)
      if (start && end) {
        matchDate = recordDate >= new Date(start) && recordDate <= new Date(end)
      } else if (start) {
        matchDate = recordDate >= new Date(start)
      }
    }

    if (filterDirection && filterDirection !== '全部') {
      matchDirection = data.direction === filterDirection
    }

    return matchDate && matchDirection
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
                value={filterDirection === '全部' ? '' : filterDirection}
                onChange={(value) => {
                  setFilterDirection(value === '策略方向' ? '全部' : value)
                  setCurrentPage(1)
                }}
                options={directionOptions}
                placeholder="策略方向"
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
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative', marginTop: '10px', paddingBottom: '50px', zIndex: '1' }}>
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
        message="是否确认删除？"
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
        getFieldComponent={(field, data, errors, onChange) => {
          // 技术指标评估部分
          if (field.key === 'description') {
            return (
              <div className="col-span-2 md:col-span-4 space-y-4">
                <textarea
                  value={data[field.key] || ''}
                  onChange={(e) => {
                    onChange({ ...data, [field.key]: e.target.value })
                    if (e.target.value && errors[field.key]) {
                      onChange({ ...data, [field.key]: e.target.value }, { [field.key]: false })
                    }
                  }}
                  placeholder="请输入"
                  className={`w-full px-3 py-2 border ${errors[field.key] ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  rows={2}
                />
                {errors[field.key] && (
                  <p className="text-red-500 text-xs">不能为空</p>
                )}

                {/* 技术指标评估配置 */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">技术指标评估配置</h4>
                  <div className="space-y-4">
                    {INDICATOR_FIELD_NAMES.map((indicator, index) => {
                      const nameKey = indicator.key + 'Name'
                      const descKey = indicator.key + 'Desc'
                      const minScoreKey = indicator.key + 'MinScore'
                      const maxScoreKey = indicator.key + 'MaxScore'
                      const weightKey = indicator.key + 'Weight'

                      return (
                        <div key={indicator.key} className="border border-gray-200 rounded-lg p-3 bg-white">
                          <div className="text-xs font-medium text-gray-700 mb-2">{indicator.label}</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">指标名称</label>
                              <input
                                type="text"
                                value={data[nameKey] || ''}
                                onChange={(e) => {
                                  onChange({ ...data, [nameKey]: e.target.value })
                                  if (e.target.value && errors[nameKey]) {
                                    onChange({ ...data, [nameKey]: e.target.value }, { [nameKey]: false })
                                  }
                                }}
                                placeholder="如: MACD"
                                className={`w-full px-2 py-1 text-sm border ${errors[nameKey] ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
                              />
                              {errors[nameKey] && <p className="text-red-500 text-xs mt-1">不能为空</p>}
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">权重(0-1)</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="1"
                                value={data[weightKey] || ''}
                                onChange={(e) => {
                                  onChange({ ...data, [weightKey]: e.target.value })
                                  if (e.target.value && errors[weightKey]) {
                                    onChange({ ...data, [weightKey]: e.target.value }, { [weightKey]: false })
                                  }
                                }}
                                placeholder="0.2"
                                className={`w-full px-2 py-1 text-sm border ${errors[weightKey] ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
                              />
                              {errors[weightKey] && <p className="text-red-500 text-xs mt-1">格式错误</p>}
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">最小分值</label>
                              <input
                                type="number"
                                value={data[minScoreKey] || ''}
                                onChange={(e) => {
                                  onChange({ ...data, [minScoreKey]: e.target.value })
                                  if (e.target.value && errors[minScoreKey]) {
                                    onChange({ ...data, [minScoreKey]: e.target.value }, { [minScoreKey]: false })
                                  }
                                }}
                                placeholder="0"
                                className={`w-full px-2 py-1 text-sm border ${errors[minScoreKey] ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
                              />
                              {errors[minScoreKey] && <p className="text-red-500 text-xs mt-1">格式错误</p>}
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">最大分值</label>
                              <input
                                type="number"
                                value={data[maxScoreKey] || ''}
                                onChange={(e) => {
                                  onChange({ ...data, [maxScoreKey]: e.target.value })
                                  if (e.target.value && errors[maxScoreKey]) {
                                    onChange({ ...data, [maxScoreKey]: e.target.value }, { [maxScoreKey]: false })
                                  }
                                }}
                                placeholder="2"
                                className={`w-full px-2 py-1 text-sm border ${errors[maxScoreKey] ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
                              />
                              {errors[maxScoreKey] && <p className="text-red-500 text-xs mt-1">格式错误</p>}
                            </div>
                          </div>
                          <div className="mt-2">
                            <label className="text-xs text-gray-600 block mb-1">评估标准</label>
                            <textarea
                              value={data[descKey] || ''}
                              onChange={(e) => {
                                onChange({ ...data, [descKey]: e.target.value })
                                if (e.target.value && errors[descKey]) {
                                  onChange({ ...data, [descKey]: e.target.value }, { [descKey]: false })
                                }
                              }}
                              placeholder="如: 0=背离；1=中性；2=金叉/死叉；"
                              className={`w-full px-2 py-1 text-sm border ${errors[descKey] ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
                              rows={1}
                            />
                            {errors[descKey] && <p className="text-red-500 text-xs mt-1">不能为空</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          }
          return null
        }}
      />
      </>
  )
}

export default TradingStrategy
