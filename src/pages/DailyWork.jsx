import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Upload, Download, Globe, Calendar, BarChart3, FileText, Edit } from 'lucide-react'
import useStore from '../store/useStore'
import { format } from 'date-fns'
import Counter from '../components/Counter'
import ScrollAnimation from '../components/ScrollAnimation'
import Modal from '../components/Modal'
import * as XLSX from 'xlsx'
import { useToast } from '../contexts/ToastContext'

// 字段定义
const FIELDS = [
  { key: 'date', label: '日期', category: 'date' },
  { key: 'nasdaq', label: '纳斯达克', category: 'global' },
  { key: 'ftse', label: '英国富时', category: 'global' },
  { key: 'dax', label: '德国DAX', category: 'global' },
  { key: 'n225', label: '日经N225', category: 'global' },
  { key: 'hsi', label: '恒生指数', category: 'global' },
  { key: 'bitcoin', label: '比特币', category: 'crypto' },
  { key: 'eurusd', label: '欧元兑美元', category: 'forex' },
  { key: 'usdjpy', label: '美元兑日元', category: 'forex' },
  { key: 'usdcny', label: '美元兑人民币', category: 'forex' },
  { key: 'oil', label: '布伦特原油', category: 'commodity' },
  { key: 'gold', label: '伦敦黄金', category: 'commodity' },
  { key: 'bond', label: '国债指数', category: 'bond' },
  { key: 'consecutive', label: '昨日连板', category: 'aStock' },
  { key: 'a50', label: '富时A50', category: 'aStock' },
  { key: 'shIndex', label: '上证指数', category: 'aStock' },
  { key: 'sh2dayPower', label: '上证2日强力(亿)', category: 'capital' },
  { key: 'sh13dayPower', label: '上证13日强力(亿)', category: 'capital' },
  { key: 'upCount', label: '大盘涨家', category: 'stats' },
  { key: 'limitUp', label: '涨停', category: 'stats' },
  { key: 'downCount', label: '大盘跌家', category: 'stats' },
  { key: 'limitDown', label: '跌停', category: 'stats' },
  { key: 'volume', label: '大盘成交(亿)', category: 'stats' },
  { key: 'sentiment', label: '大盘情绪', category: 'sentiment' },
  { key: 'prediction', label: '预测当日', category: 'prediction' },
  { key: 'tradeStatus', label: '交易状态', category: 'decision' },
]

const DailyWork = () => {
  const { showToast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showFilterDatePicker, setShowFilterDatePicker] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({})
  const [formErrors, setFormErrors] = useState({})
  const [selectedIds, setSelectedIds] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [jumpToPage, setJumpToPage] = useState(1)
  const [importResult, setImportResult] = useState(null)
  const [errorWorkbook, setErrorWorkbook] = useState(null)
  const [exportFormat, setExportFormat] = useState('xlsx')
  const [importFile, setImportFile] = useState(null)
  const [importFileError, setImportFileError] = useState(false)
  const [filterDate, setFilterDate] = useState('')
  const [filterSentiment, setFilterSentiment] = useState('')
  const pageSize = 20

  const dailyWorkData = useStore(state => state.dailyWorkData)
  const addDailyWorkData = useStore(state => state.addDailyWorkData)
  const deleteDailyWorkData = useStore(state => state.deleteDailyWorkData)
  const deleteMultipleDailyWorkData = useStore(state => state.deleteMultipleDailyWorkData)
  const importDailyWorkData = useStore(state => state.importDailyWorkData)
  const updateDailyWorkData = useStore(state => state.updateDailyWorkData)

  // 初始化表单数据
  useEffect(() => {
    const initialData = {}
    FIELDS.forEach(field => {
      initialData[field.key] = ''
    })
    setFormData(initialData)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()

    // 验证所有必填项
    const errors = {}
    FIELDS.forEach(field => {
      if (!formData[field.key] || formData[field.key].trim() === '') {
        errors[field.key] = true
      }
    })

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    // 保持日期格式为 yyyy-MM-dd
    const submitData = { ...formData }

    if (isEditMode && editingId) {
      // 编辑模式
      updateDailyWorkData(editingId, submitData)
      showToast('更新成功')
    } else {
      // 新增模式
      addDailyWorkData(submitData)
      showToast('保存成功')
    }

    setShowModal(false)
    // 重置表单和错误
    const initialData = {}
    FIELDS.forEach(field => {
      initialData[field.key] = ''
    })
    setFormData(initialData)
    setFormErrors({})
    setIsEditMode(false)
    setEditingId(null)
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
    // 重置表单数据
    const initialData = {}
    FIELDS.forEach(field => {
      initialData[field.key] = ''
    })
    setFormData(initialData)
  }

  // 自定义日期选择器组件
  const CustomDatePicker = ({ value, onChange, placeholder = '日期', className = '' }) => {
    const [isOpen, setIsOpen] = useState(false)
    const ref = React.useRef(null)

    // 点击外部关闭
    React.useEffect(() => {
      const handleClickOutside = (event) => {
        if (ref.current && !ref.current.contains(event.target)) {
          setIsOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleDateClick = (date) => {
      onChange(date)
      setIsOpen(false)
    }

    const handleClear = (e) => {
      e.stopPropagation()
      onChange('')
      setIsOpen(false)
    }

    // 生成日历
    const generateCalendar = () => {
      const today = new Date()
      const year = today.getFullYear()
      const month = today.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const startDay = firstDay.getDay()
      const daysInMonth = lastDay.getDate()

      const days = []
      // 填充空白
      for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>)
      }
      // 填充日期
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const isSelected = value === dateStr
        days.push(
          <button
            key={day}
            onClick={() => handleDateClick(dateStr)}
            className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-colors ${
              isSelected
                ? 'bg-[#0F1419] text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            {day}
          </button>
        )
      }
      return days
    }

    return (
      <div ref={ref} className={`relative ${className}`}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-2 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-blue-500 transition-colors text-sm cursor-pointer flex items-center justify-between w-full"
        >
          <span style={{ color: value ? '#1f2937' : '#9ca3af' }}>
            {value || placeholder}
          </span>
          <div className="flex items-center gap-2">
            {value && (
              <button
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="清空"
              >
                ✕
              </button>
            )}
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        {isOpen && (
          <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50" style={{ width: '280px' }}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-gray-700">
                {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                <div key={day} className="w-8 h-8 flex items-center justify-center text-xs text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {generateCalendar()}
            </div>
          </div>
        )}
      </div>
    )
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

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          dateNF: 'yyyy-mm-dd',
          cellDates: true,
          cellText: false
        })

        console.log('读取到的数据:', jsonData)

        if (jsonData.length < 2) {
          alert('文件格式不正确或没有数据')
          return
        }

        const headers = jsonData[0]
        console.log('文件表头:', headers)

        const dataList = []
        const errorList = []
        const existingDates = new Set(dailyWorkData.map(d => d.date))

        // 辅助函数：将各种日期格式统一转换为 YYYY-MM-DD
        const formatToYYYYMMDD = (value) => {
          if (!value) return value
          
          const trimmedValue = String(value).trim()
          
          // 如果已经是 YYYY-MM-DD 格式，直接返回
          if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
            return trimmedValue
          }
          
          // 尝试解析各种日期格式
          const date = new Date(trimmedValue)
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
          }
          
          // 处理 "YYYY/MM/DD" 格式
          const match = trimmedValue.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/)
          if (match) {
            const year = parseInt(match[1])
            const month = String(parseInt(match[2])).padStart(2, '0')
            const day = String(parseInt(match[3])).padStart(2, '0')
            return `${year}-${month}-${day}`
          }
          
          // 处理 "MM/DD/YYYY" 格式
          const slashMatch = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
          if (slashMatch) {
            const year = parseInt(slashMatch[3])
            const month = String(parseInt(slashMatch[1])).padStart(2, '0')
            const day = String(parseInt(slashMatch[2])).padStart(2, '0')
            return `${year}-${month}-${day}`
          }
          
          // 处理 "MM-DD-YYYY" 格式
          const dashMatch = trimmedValue.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
          if (dashMatch) {
            const year = parseInt(dashMatch[3])
            const month = String(parseInt(dashMatch[1])).padStart(2, '0')
            const day = String(parseInt(dashMatch[2])).padStart(2, '0')
            return `${year}-${month}-${day}`
          }
          
          return trimmedValue
        }

        // 定义固定选项的字段
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

              // 检查必填项
              if (!value) {
                errors.push(`[${field.label}]不能为空；`)
              }

              // 检查日期格式
              if (field.key === 'date' && value) {
                // 使用 formatToYYYYMMDD 转换为 YYYY-MM-DD 格式
                const formattedDate = formatToYYYYMMDD(value)
                
                // 验证是否为有效的 YYYY-MM-DD 格式
                const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(formattedDate)
                
                if (!isValidFormat) {
                  errors.push('[日期]格式错误；')
                } else {
                  data[field.key] = formattedDate

                  // 检查日期是否已存在
                  if (existingDates.has(data[field.key])) {
                    errors.push('[日期]已存在数据；')
                  }
                }
              }

              // 检查大盘情绪格式
              if (field.key === 'sentiment' && value && !validSentiments.includes(value)) {
                errors.push('[大盘情绪]格式错误；')
              }

              // 检查预测当日格式
              if (field.key === 'prediction' && value && !validPredictions.includes(value)) {
                errors.push('[预测当日]格式错误；')
              }

              // 检查交易状态格式
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

          console.log(`第 ${i} 行数据:`, data, errors.length > 0 ? errors : '')
        }

        console.log('有效数据条数:', dataList.length)
        console.log('错误数据条数:', errorList.length)

        // 生成错误工作簿（但不自动下载）
        let wb = null
        if (errorList.length > 0) {
          const errorHeaders = ['错误信息', ...headers]
          const errorRows = errorList.map(error => [
            error.errors,
            ...jsonData[error.rowIndex - 1].map(v => v !== undefined ? String(v) : '')
          ])

          const errorWorksheet = XLSX.utils.aoa_to_sheet([errorHeaders, ...errorRows])
          wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, errorWorksheet, '导入错误')
        }


        // 设置导入结果
        setImportResult({
          success: dataList.length > 0,
          successCount: dataList.length,
          errorCount: errorList.length,
          totalCount: dataList.length + errorList.length
        })
        setErrorWorkbook(wb)

        // 导入成功的数据
        if (dataList.length > 0) {
          importDailyWorkData(dataList)
          // 如果全部成功，关闭弹窗并显示成功提示
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

  const handleDownloadErrorFile = () => {
    if (errorWorkbook) {
      XLSX.writeFile(errorWorkbook, `每日功课_导入错误_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`)
    }
  }

  const handleDownloadTemplate = () => {
    const headers = FIELDS.map(f => f.label)
    const worksheet = XLSX.utils.aoa_to_sheet([headers])

    // 为"日期"字段设置单元格格式为日期格式
    const dateColIndex = headers.findIndex(h => h === '日期')
    if (dateColIndex !== -1) {
      // 设置第一行（表头）的格式
      const dateCellRef = XLSX.utils.encode_cell({ r: 0, c: dateColIndex })
      if (worksheet[dateCellRef]) {
        worksheet[dateCellRef].z = 'yyyy-mm-dd'
      }
    }

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '模板')
    XLSX.writeFile(workbook, '每日功课_导入模板.xlsx')
  }

  const handleExport = () => {
    if (dailyWorkData.length === 0) {
      alert('暂无数据可导出')
      return
    }
    setShowExportModal(true)
  }

  const handleConfirmExport = () => {
    const headers = FIELDS.map(f => f.label)
    const rows = sortedData.map(data =>
      FIELDS.map(f => data[f.key] || '')
    )

    if (exportFormat === 'xlsx') {
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '每日功课')
      XLSX.writeFile(workbook, `每日功课_${format(new Date(), 'yyyyMMdd')}.xlsx`)
    } else {
      const csv = XLSX.utils.aoa_to_sheet([headers, ...rows])
      const csvContent = XLSX.utils.sheet_to_csv(csv)
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
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

  // 筛选数据
  const filteredData = sortedData.filter(data => {
    let matchDate = true
    let matchSentiment = true

    if (filterDate) {
      matchDate = data.date === filterDate
    }

    if (filterSentiment) {
      matchSentiment = data.sentiment === filterSentiment
    }

    return matchDate && matchSentiment
  })

  const latestData = sortedData[0]

  const totalPages = Math.ceil(filteredData.length / pageSize)
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    setJumpToPage(page)
  }

  const getSentimentColor = (sentiment) => {
    if (!sentiment) return 'bg-gray-50 text-gray-600'
    if (sentiment.includes('沸点')) return 'bg-red-100 text-red-600'
    if (sentiment.includes('过热')) return 'bg-orange-100 text-orange-600'
    if (sentiment.includes('微冷')) return 'bg-blue-100 text-blue-600'
    if (sentiment.includes('过冷')) return 'bg-cyan-100 text-cyan-600'
    return 'bg-gray-50 text-gray-600'
  }

  const getPredictionColor = (prediction) => {
    if (!prediction) return 'text-gray-600'
    if (prediction.includes('看涨')) return 'text-green-600'
    if (prediction.includes('看跌')) return 'text-red-600'
    return 'text-gray-600'
  }

  const getTradeStatusColor = (status) => {
    if (!status) return 'bg-gray-50 text-gray-600'
    if (status.includes('积极地')) return 'bg-green-100 text-green-600'
    if (status.includes('保守地')) return 'bg-blue-100 text-blue-600'
    if (status.includes('防御地')) return 'bg-yellow-100 text-yellow-600'
    return 'bg-gray-50 text-gray-600'
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(paginatedData.map(d => d.id))
    } else {
      setSelectedIds([])
    }
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
    deleteMultipleDailyWorkData(selectedIds)
    setSelectedIds([])
    setShowDeleteModal(false)
    showToast(`删除成功`)
  }

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
        {/* 工具栏 */}
        <div style={{ flexShrink: 0, marginTop: '10px' }}>
          <div className="flex flex-col">
            {/* 筛选条件 */}
            <div className="flex gap-4 items-center">
              <div style={{ position: 'relative', width: '240px' }}>
                <CustomDatePicker
                  value={filterDate}
                  onChange={(date) => {
                    setFilterDate(date)
                    setCurrentPage(1)
                  }}
                  placeholder="日期"
                />
              </div>
              <div style={{ position: 'relative', width: '240px' }}>
                <select
                  value={filterSentiment}
                  onChange={(e) => {
                    setFilterSentiment(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-3 py-2 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-blue-500 transition-colors appearance-none text-sm w-full"
                  style={{
                    color: filterSentiment ? '#1f2937' : '#9ca3af'
                  }}
                >
                  <option value="" style={{ color: '#1f2937' }}>大盘情绪</option>
                  <option value="冰点" style={{ color: '#1f2937' }}>冰点</option>
                  <option value="过冷" style={{ color: '#1f2937' }}>过冷</option>
                  <option value="微冷" style={{ color: '#1f2937' }}>微冷</option>
                  <option value="微热" style={{ color: '#1f2937' }}>微热</option>
                  <option value="过热" style={{ color: '#1f2937' }}>过热</option>
                  <option value="沸点" style={{ color: '#1f2937' }}>沸点</option>
                </select>
                <div style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#9ca3af'
                }}>
                  ▼
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4" style={{ marginTop: '10px' }}>
              <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsEditMode(false)
                  setShowModal(true)
                }}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新增
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEdit}
                disabled={selectedIds.length !== 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Edit className="w-4 h-4" />
                编辑
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                导入
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExport}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                导出
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDelete}
                disabled={selectedIds.length === 0}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </motion.button>
            </div>
            <div className="text-sm text-gray-500">
              共 {filteredData.length} 条记录
            </div>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative', marginTop: '10px', paddingBottom: '50px', zIndex: '1' }}>
          {/* 滚动容器 */}
          <div className="overflow-y-auto overflow-x-auto" style={{ flex: 1, minHeight: 'calc(100vh - 52px - 10px - 80px - 10px - 50px - 4px)', maxHeight: 'calc(100vh - 52px - 10px - 80px - 10px - 50px - 4px)', position: 'relative', zIndex: '1' }}>
            <table style={{ width: '1800px' }}>
              <thead>
                <tr className="border-b sticky top-0" style={{ backgroundColor: '#F1F5F9', zIndex: '20' }}>
                  <th className="px-0 py-2 text-left text-sm font-normal text-gray-700 whitespace-nowrap w-10 sticky left-0 bg-[#F1F5F9]" style={{ backgroundColor: '#F1F5F9', margin: '0', padding: '0', paddingLeft: '10px', paddingRight: '10px', zIndex: '30' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === paginatedData.length && paginatedData.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      style={{ position: 'relative', zIndex: '1' }}
                    />
                  </th>
                  {FIELDS.map((field, index) => (
                    <th key={field.key} className="px-4 py-2 text-left text-sm font-normal text-gray-700 whitespace-nowrap" style={{ backgroundColor: '#F1F5F9' }}>
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={FIELDS.length + 1} className="px-0 py-4 text-center text-gray-500 text-sm">
                        <div className="flex flex-col items-center justify-center gap-3" style={{ height: 'calc(100vh - 52px - 10px - 80px - 10px - 50px - 100px)', display: 'flex', alignItems: 'center' }}>
                          <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="120" height="120">
                            <path d="M688.551724 0m26.482759 0l0 0q26.482759 0 26.482758 26.482759l0 52.965517q0 26.482759-26.482758 26.482758l0 0q-26.482759 0-26.482759-26.482758l0-52.965517q0-26.482759 26.482759-26.482759Z" fill="#E9ECF0"></path>
                            <path d="M935.724138 194.206897m0 26.482758l0 0q0 26.482759-26.482759 26.482759l-52.965517 0q-26.482759 0-26.482759-26.482759l0 0q0-26.482759 26.482759-26.482758l52.965517 0q26.482759 0 26.482759 26.482758Z" fill="#E9ECF0"></path>
                            <path d="M887.487035 10.784826m18.726138 18.726139l0 0q18.726138 18.726138 0 37.452276l-74.904553 74.904553q-18.726138 18.726138-37.452276 0l0 0q-18.726138-18.726138 0-37.452276l74.904553-74.904553q18.726138-18.726138 37.452276 0Z" fill="#E9ECF0"></path>
                            <path d="M653.241379 141.241379l141.24138 141.24138v706.206896a35.310345 35.310345 0 0 1-35.310345 35.310345H123.586207a35.310345 35.310345 0 0 1-35.310345-35.310345V176.551724a35.310345 35.310345 0 0 1 35.310345-35.310345h529.655172z" fill="#E9ECF0"></path>
                            <path d="M225.103448 414.896552m26.482759 0l379.586207 0q26.482759 0 26.482758 26.482758l0 0q0 26.482759-26.482758 26.482759l-379.586207 0q-26.482759 0-26.482759-26.482759l0 0q0-26.482759 26.482759-26.482758Z" fill="#D1D7DE"></path>
                            <path d="M225.103448 556.137931m26.482759 0l379.586207 0q26.482759 0 26.482758 26.482759l0 0q0 26.482759-26.482758 26.482758l-379.586207 0q-26.482759 0-26.482759-26.482758l0 0q0-26.482759 26.482759-26.482759Z" fill="#D1D7DE"></path>
                            <path d="M225.103448 697.37931m26.482759 0l211.862069 0q26.482759 0 26.482758 26.482759l0 0q0 26.482759-26.482758 26.482759l-211.862069 0q-26.482759 0-26.482759-26.482759l0 0q0-26.482759 26.482759-26.482759Z" fill="#D1D7DE"></path>
                            <path d="M653.241379 141.241379l141.24138 141.24138h-105.931035a35.310345 35.310345 0 0 1-35.310345-35.310345V141.241379z" fill="#D1D7DE"></path>
                          </svg>
                          <p>暂无数据</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                    {paginatedData.map((data, index) => (
                      <motion.tr
                        key={data.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.02 }}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-0 py-3 w-10 sticky left-0 bg-white" style={{ margin: '0', padding: '0', paddingLeft: '10px', paddingRight: '10px', zIndex: '10' }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(data.id)}
                            onChange={(e) => handleSelectOne(data.id, e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                            style={{ position: 'relative', zIndex: '1' }}
                          />
                        </td>
                        {FIELDS.map((field, index) => (
                          <td key={field.key} className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            <span className="font-medium text-gray-700">{data[field.key] || '-'}</span>
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 分页器 */}
        {totalPages >= 0 && (
          <div style={{ position: 'absolute', right: '0', bottom: '0', height: '50px', zIndex: '10', width: '100%' }} className="py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-4 px-4">
                <div className="text-sm text-gray-500">
                  已选{selectedIds.length}条/共{filteredData.length}条
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    style={{ color: '#0F1419' }}
                  >
                    上一页
                  </motion.button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <motion.button
                      key={page}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1.5 text-sm rounded transition-colors ${
                        currentPage === page
                          ? 'bg-[#0F1419] text-white'
                          : 'border border-gray-300 hover:bg-white'
                      }`}
                      style={{ color: currentPage === page ? '#ffffff' : '#0F1419' }}
                    >
                      {page}
                    </motion.button>
                  ))}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    style={{ color: '#0F1419' }}
                  >
                    下一页
                  </motion.button>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-sm text-gray-500">跳至</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={jumpToPage}
                      onChange={(e) => setJumpToPage(Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1)))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handlePageChange(jumpToPage)
                        }
                      }}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-center"
                    />
                    <span className="text-sm text-gray-500">页</span>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePageChange(jumpToPage)}
                      disabled={jumpToPage === currentPage}
                      className="px-3 py-1.5 text-sm rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      style={{ backgroundColor: '#0F1419', color: '#ffffff' }}
                    >
                      跳转
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
      </div>
    </div>

      {/* 导入弹窗 */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false)
          setImportResult(null)
          setErrorWorkbook(null)
          setImportFile(null)
          setImportFileError(false)
        }}
        title="导入"
        footer={
          <div className="flex items-center justify-between w-full">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownloadTemplate}
              className="px-3 py-2 border rounded transition-colors text-sm flex items-center gap-2"
              style={{ borderColor: '#0F1419', color: '#0F1419' }}
            >
              <Download className="w-4 h-4" />
              导入模板
            </motion.button>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportResult(null)
                  setErrorWorkbook(null)
                  setImportFile(null)
                  setImportFileError(false)
                }}
                className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-4 py-2 rounded text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#0F1419' }}
              >
                确定
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className={`w-full px-4 py-3 border rounded text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-white hover:file:opacity-90 transition-all text-sm ${importFileError ? 'border-red-500' : 'border-gray-300'}`}
            />
            {importFileError && (
              <p className="text-red-500 text-xs mt-1">不能为空</p>
            )}
          </div>
          {importResult && (
            <div className="p-3 bg-gray-50 rounded text-sm">
              <p className={importResult.success ? "text-green-600" : "text-red-600"}>
                {importResult.success
                  ? `部分导入成功！成功导入 ${importResult.successCount} 条数据`
                  : `导入失败！`}
                {importResult.errorCount > 0 && `，有 ${importResult.errorCount} 条数据存在错误`}
              </p>
              <p className="text-gray-600 mt-1">
                共处理 {importResult.totalCount} 条数据
              </p>
              {errorWorkbook && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownloadErrorFile}
                  className="mt-2 w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  下载错误表格
                </motion.button>
              )}
            </div>
          )}
          <p className="text-sm text-gray-500">
            支持 Excel 和 CSV 格式，建议先下载模板再导入
          </p>
        </div>
      </Modal>

      {/* 导出确认弹窗 */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="导出"
        footer={
          <>
            <button
              onClick={() => setShowExportModal(false)}
              className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirmExport}
              className="px-4 py-2 rounded text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#0F1419' }}
            >
              确定
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="exportFormat"
                value="xlsx"
                checked={exportFormat === 'xlsx'}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-4 h-4"
                style={{ accentColor: '#0F1419' }}
              />
              <span className="text-sm text-gray-700">.xlsx</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="exportFormat"
                value="csv"
                checked={exportFormat === 'csv'}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-4 h-4"
                style={{ accentColor: '#0F1419' }}
              />
              <span className="text-sm text-gray-700">.csv</span>
            </label>
          </div>
          <p className="text-sm text-gray-500">
            共 {sortedData.length} 条记录
          </p>
        </div>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="删除"
        footer={
          <>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 rounded text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#0F1419' }}
            >
              确定
            </button>
          </>
        }
      >
        <p className="text-gray-600">
          是否确认删除？
        </p>
      </Modal>

      {/* 添加/编辑记录弹窗 */}
      <Modal
        isOpen={showModal}
        onClose={handleModalClose}
        title={isEditMode ? "编辑" : "新增"}
        width="max-w-6xl"
        footer={
          <>
            <button
              onClick={handleModalClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              form="addForm"
              className="px-4 py-2 rounded text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#0F1419' }}
            >
              保存
            </button>
          </>
        }
      >
        <form id="addForm" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {FIELDS.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm text-gray-600 mb-1.5">
                      <span className="text-red-500">*</span> {field.label}
                    </label>
                    {field.key === 'date' ? (
                      <CustomDatePicker
                        value={formData[field.key] || ''}
                        onChange={(date) => {
                          setFormData({ ...formData, [field.key]: date })
                          if (date && formErrors[field.key]) {
                            setFormErrors(prev => ({ ...prev, [field.key]: false }))
                          }
                        }}
                        placeholder="请输入"
                        className="w-full"
                      />
                    ) : field.key === 'sentiment' ? (
                      <div style={{ position: 'relative', width: '100%' }}>
                        <select
                          value={formData[field.key] || ''}
                          onChange={(e) => {
                            setFormData({ ...formData, [field.key]: e.target.value })
                            if (e.target.value && formErrors[field.key]) {
                              setFormErrors(prev => ({ ...prev, [field.key]: false }))
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded text-gray-700 focus:outline-none transition-colors appearance-none text-sm ${formErrors[field.key] ? 'border-red-500' : 'border-gray-300'}`}
                          style={{
                            color: formData[field.key] ? '#1f2937' : '#9ca3af'
                          }}
                        >
                          <option value="" style={{ color: '#9ca3af' }}>请选择</option>
                          <option value="冰点" style={{ color: '#1f2937' }}>冰点</option>
                          <option value="过冷" style={{ color: '#1f2937' }}>过冷</option>
                          <option value="微冷" style={{ color: '#1f2937' }}>微冷</option>
                          <option value="微热" style={{ color: '#1f2937' }}>微热</option>
                          <option value="过热" style={{ color: '#1f2937' }}>过热</option>
                          <option value="沸点" style={{ color: '#1f2937' }}>沸点</option>
                        </select>
                        <div style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                          color: '#9ca3af'
                        }}>
                          ▼
                        </div>
                      </div>
                    ) : field.key === 'prediction' ? (
                      <div style={{ position: 'relative', width: '100%' }}>
                        <select
                          value={formData[field.key] || ''}
                          onChange={(e) => {
                            setFormData({ ...formData, [field.key]: e.target.value })
                            if (e.target.value && formErrors[field.key]) {
                              setFormErrors(prev => ({ ...prev, [field.key]: false }))
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded text-gray-700 focus:outline-none transition-colors appearance-none text-sm ${formErrors[field.key] ? 'border-red-500' : 'border-gray-300'}`}
                          style={{
                            color: formData[field.key] ? '#1f2937' : '#9ca3af'
                          }}
                        >
                          <option value="" style={{ color: '#9ca3af' }}>请选择</option>
                          <option value="看涨" style={{ color: '#1f2937' }}>看涨</option>
                          <option value="看跌" style={{ color: '#1f2937' }}>看跌</option>
                        </select>
                        <div style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                          color: '#9ca3af'
                        }}>
                          ▼
                        </div>
                      </div>
                    ) : field.key === 'tradeStatus' ? (
                      <div style={{ position: 'relative', width: '100%' }}>
                        <select
                          value={formData[field.key] || ''}
                          onChange={(e) => {
                            setFormData({ ...formData, [field.key]: e.target.value })
                            if (e.target.value && formErrors[field.key]) {
                              setFormErrors(prev => ({ ...prev, [field.key]: false }))
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded text-gray-700 focus:outline-none transition-colors appearance-none text-sm ${formErrors[field.key] ? 'border-red-500' : 'border-gray-300'}`}
                          style={{
                            color: formData[field.key] ? '#1f2937' : '#9ca3af'
                          }}
                        >
                          <option value="" style={{ color: '#9ca3af' }}>请选择</option>
                          <option value="积极地" style={{ color: '#1f2937' }}>积极地</option>
                          <option value="保守地" style={{ color: '#1f2937' }}>保守地</option>
                          <option value="防御地" style={{ color: '#1f2937' }}>防御地</option>
                        </select>
                        <div style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                          color: '#9ca3af'
                        }}>
                          ▼
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={formData[field.key] || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, [field.key]: e.target.value })
                          if (e.target.value && formErrors[field.key]) {
                            setFormErrors(prev => ({ ...prev, [field.key]: false }))
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded focus:outline-none transition-colors text-sm ${formErrors[field.key] ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="请输入"
                        style={{ color: formData[field.key] ? '#1f2937' : '#9ca3af' }}
                      />
                    )}
                    {formErrors[field.key] && (
                      <p className="text-red-500 text-xs mt-1">不能为空</p>
                    )}
                  </div>
                ))}
              </div>
            </form>
          </Modal>
      </>
  )
}

export default DailyWork
