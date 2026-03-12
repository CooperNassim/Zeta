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

// API基础URL
const API_BASE_URL = ''

// API调用函数
const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }
    if (data) {
      options.body = JSON.stringify(data)
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options)
    return await response.json()
  } catch (error) {
    console.error('API调用失败:', error)
    return { success: false, error: error.message }
  }
}

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
    // 只检查当前显示的未删除数据，已删除的数据可以重复创建
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

        // 获取数据库中所有现有的日期（包括软删除的）
        let existingDates = new Set()
        try {
          const allDataResponse = await apiCall('/api/daily_work_data?includeDeleted=true')
          if (allDataResponse && allDataResponse.data) {
            existingDates = new Set(allDataResponse.data.map(d => {
              // 统一处理日期格式
              let dateStr = d.date
              if (dateStr && typeof dateStr === 'string' && dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0]
              }
              return dateStr
            }))
          }
        } catch (e) {
          console.warn('[DailyWork] 获取现有日期失败:', e)
        }

        console.log('[DailyWork] 数据库中已存在的日期:', Array.from(existingDates))

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
          const isUpdate = false

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

                  // 检查日期是否已存在，如果存在标记为更新（恢复已删除记录）
                  if (existingDates.has(data[field.key])) {
                    data._isUpdate = true  // 标记为更新操作
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
          // 分离新增和更新（恢复已删除）的数据
          const newDataList = dataList.filter(d => !d._isUpdate)
          const updateDataList = dataList.filter(d => d._isUpdate)

          console.log('[DailyWork] 新增数据:', newDataList.length, '条')
          console.log('[DailyWork] 更新数据（恢复已删除）:', updateDataList.length, '条')

          // 对新数据去重（Excel文件中可能有重复的日期）
          const newDataMap = new Map()
          newDataList.forEach(data => {
            if (data.date) {
              newDataMap.set(data.date, data)
            }
          })
          const uniqueNewDataList = Array.from(newDataMap.values())

          console.log('[DailyWork] 去重后的新数据:', uniqueNewDataList.length, '条')

          let successCount = 0

          // 1. 批量插入新数据
          if (uniqueNewDataList.length > 0) {
            // 打印所有要插入的日期，方便调试
            console.log('[DailyWork] 准备插入的日期:', uniqueNewDataList.map(d => d.date).sort())

            const dbDataList = uniqueNewDataList.map(data => ({
              date: data.date || null,
              nasdaq: data.nasdaq || null,
              ftse: data.ftse || null,
              dax: data.dax || null,
              n225: data.n225 || null,
              hsi: data.hsi || null,
              bitcoin: data.bitcoin || null,
              eurusd: data.eurusd || null,
              usdjpy: data.usdjpy || null,
              usdcny: data.usdcny || null,
              oil: data.oil || null,
              gold: data.gold || null,
              bond: data.bond || null,
              consecutive: data.consecutive || null,
              a50: data.a50 || null,
              sh_index: data.shIndex || null,
              sh_2day_power: data.sh2dayPower || null,
              sh_13day_power: data.sh13dayPower || null,
              up_count: data.upCount || null,
              limit_up: data.limitUp || null,
              down_count: data.downCount || null,
              limit_down: data.limitDown || null,
              volume: data.volume || null,
              sentiment: data.sentiment || null,
              prediction: data.prediction || null,
              trade_status: data.tradeStatus || null,
              review_plan: data.reviewPlan || null,
              review_execution: data.reviewExecution || null,
              review_result: data.reviewResult || null,
              deleted: false,
              deleted_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }))

            const bulkResult = await apiCall('/api/daily_work_data/bulk', 'POST', dbDataList)
            console.log('[DailyWork] 批量插入结果:', bulkResult)

            if (bulkResult && bulkResult.success) {
              successCount += bulkResult.count || 0
            }
          }

          // 2. 更新已删除的记录（恢复并更新数据）
          if (updateDataList.length > 0) {
            // 先获取所有记录以找到对应的ID
            const allDataResponse = await apiCall('/api/daily_work_data?includeDeleted=true')
            if (allDataResponse && allDataResponse.data) {
              for (const data of updateDataList) {
                // 找到对应日期的记录
                const existingRecord = allDataResponse.data.find(d => {
                  let dateStr = d.date
                  if (dateStr && typeof dateStr === 'string' && dateStr.includes('T')) {
                    dateStr = dateStr.split('T')[0]
                  }
                  return dateStr === data.date
                })

                if (existingRecord) {
                  const dbData = {
                    date: data.date || null,
                    nasdaq: data.nasdaq || null,
                    ftse: data.ftse || null,
                    dax: data.dax || null,
                    n225: data.n225 || null,
                    hsi: data.hsi || null,
                    bitcoin: data.bitcoin || null,
                    eurusd: data.eurusd || null,
                    usdjpy: data.usdjpy || null,
                    usdcny: data.usdcny || null,
                    oil: data.oil || null,
                    gold: data.gold || null,
                    bond: data.bond || null,
                    consecutive: data.consecutive || null,
                    a50: data.a50 || null,
                    sh_index: data.shIndex || null,
                    sh_2day_power: data.sh2dayPower || null,
                    sh_13day_power: data.sh13dayPower || null,
                    up_count: data.upCount || null,
                    limit_up: data.limitUp || null,
                    down_count: data.downCount || null,
                    limit_down: data.limitDown || null,
                    volume: data.volume || null,
                    sentiment: data.sentiment || null,
                    prediction: data.prediction || null,
                    trade_status: data.tradeStatus || null,
                    review_plan: data.reviewPlan || null,
                    review_execution: data.reviewExecution || null,
                    review_result: data.reviewResult || null,
                    deleted: false,  // 恢复删除状态
                    deleted_at: null,
                    updated_at: new Date().toISOString()
                  }

                  const updateResult = await apiCall(`/api/daily_work_data/${existingRecord.id}`, 'PUT', dbData)
                  console.log('[DailyWork] 更新记录结果:', updateResult)

                  if (updateResult && updateResult.success) {
                    successCount++
                  }
                }
              }
            }
          }

          console.log('[DailyWork] 总共导入/恢复:', successCount, '条')

          if (errorList.length === 0) {
            // 导入成功后，从数据库重新同步数据（增加重试机制）
            let syncResult = null
            for (let i = 0; i < 3; i++) {
              try {
                syncResult = await apiCall('/api/sync/all')
                console.log(`[DailyWork] 第${i+1}次同步结果:`, syncResult)
                if (syncResult && syncResult.success) {
                  break
                }
              } catch (e) {
                console.warn(`[DailyWork] 第${i+1}次同步失败:`, e)
                if (i < 2) await new Promise(resolve => setTimeout(resolve, 1000))
              }
            }

            if (syncResult && syncResult.success && syncResult.data && syncResult.data.daily_work_data !== undefined) {
              console.log('[DailyWork] 导入的daily_work_data数量:', syncResult.data.daily_work_data?.length || 0)
              importDailyWorkData(syncResult.data.daily_work_data)
              showToast(`导入成功！共 ${successCount} 条数据`)
            } else {
              console.error('[DailyWork] 同步失败，syncResult:', syncResult)
              showToast('导入完成，但数据同步可能有问题，请刷新页面')
            }
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

  const confirmDelete = async () => {
    try {
      // 获取选中的数据项（包含日期）
      const selectedItems = dailyWorkData.filter(d => selectedIds.includes(d.id))
      console.log('[DailyWork] 选中要删除的数据:', selectedItems.map(d => ({ id: d.id, date: d.date })))

      // 调用删除函数（现在是异步的）
      const result = await deleteMultipleDailyWorkData(selectedIds)

      if (result.success) {
        setSelectedIds([])
        setShowDeleteModal(false)
        showToast(`删除成功`)
      } else {
        showToast('删除失败,请重试')
      }
    } catch (error) {
      console.error('[DailyWork] 删除出错:', error)
      showToast('删除失败,请重试')
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
