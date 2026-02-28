import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Upload, Download, Globe, Calendar, BarChart3, FileText } from 'lucide-react'
import useStore from '../store/useStore'
import { format } from 'date-fns'
import Counter from '../components/Counter'
import ScrollAnimation from '../components/ScrollAnimation'
import * as XLSX from 'xlsx'

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
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formData, setFormData] = useState({})
  const [selectedIds, setSelectedIds] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [jumpToPage, setJumpToPage] = useState(1)
  const pageSize = 20

  const dailyWorkData = useStore(state => state.dailyWorkData)
  const addDailyWorkData = useStore(state => state.addDailyWorkData)
  const deleteDailyWorkData = useStore(state => state.deleteDailyWorkData)
  const deleteMultipleDailyWorkData = useStore(state => state.deleteMultipleDailyWorkData)
  const importDailyWorkData = useStore(state => state.importDailyWorkData)

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
    // 转换日期格式从 yyyy-MM-dd 到 yy-MM-dd
    const submitData = { ...formData }
    if (submitData.date) {
      const dateMatch = submitData.date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (dateMatch) {
        submitData.date = `${dateMatch[2].slice(-2)}-${dateMatch[1].slice(-2)}-${dateMatch[2].slice(-2)}`
      }
    }
    addDailyWorkData(submitData)
    setShowModal(false)
    // 重置表单
    const initialData = {}
    FIELDS.forEach(field => {
      initialData[field.key] = ''
    })
    setFormData(initialData)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

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
                const slashFormat = /^\d{2}\/\d{2}\/\d{2}$/
                const dashFormat = /^\d{2}-\d{2}-\d{2}$/

                if (!slashFormat.test(value) && !dashFormat.test(value)) {
                  errors.push('[日期]格式错误；')
                } else {
                  // 统一转换为 YY-MM-DD 格式
                  data[field.key] = value.replace(/\//g, '-')

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

        // 如果有错误，先生成错误表格
        if (errorList.length > 0) {
          const errorHeaders = ['行号', '错误信息', ...headers]
          const errorRows = errorList.map(error => [
            error.rowIndex,
            error.errors,
            ...jsonData[error.rowIndex - 1].map(v => v !== undefined ? String(v) : '')
          ])

          const errorWorksheet = XLSX.utils.aoa_to_sheet([errorHeaders, ...errorRows])
          const errorWorkbook = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(errorWorkbook, errorWorksheet, '导入错误')
          XLSX.writeFile(errorWorkbook, `每日功课_导入错误_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`)

          // 导入成功的数据
          if (dataList.length > 0) {
            importDailyWorkData(dataList)
            alert(`部分导入成功！成功导入 ${dataList.length} 条数据，有 ${errorList.length} 条数据存在错误，已生成错误表格。`)
          } else {
            alert(`导入失败！有 ${errorList.length} 条数据存在错误，已生成错误表格。`)
          }
        } else if (dataList.length > 0) {
          importDailyWorkData(dataList)
          setShowImportModal(false)
          alert(`成功导入 ${dataList.length} 条数据`)
        } else {
          alert('未找到有效的数据，请检查文件内容。')
        }
      } catch (error) {
        console.error('导入失败:', error)
        alert('导入失败：' + error.message)
      }
    }

    reader.onerror = () => {
      alert('文件读取失败，请重试')
    }

    reader.readAsArrayBuffer(file)
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

    const headers = FIELDS.map(f => f.label)
    const rows = sortedData.map(data =>
      FIELDS.map(f => data[f.key] || '')
    )

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '每日功课')
    XLSX.writeFile(workbook, `每日功课_${format(new Date(), 'yyyyMMdd')}.xlsx`)
  }

  const sortedData = [...dailyWorkData].sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateB - dateA
  })

  const latestData = sortedData[0]

  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
    if (selectedIds.length === 0) {
      alert('请先选择要删除的记录')
      return
    }
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    deleteMultipleDailyWorkData(selectedIds)
    setSelectedIds([])
    setShowDeleteModal(false)
    alert(`已删除 ${selectedIds.length} 条记录`)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '10px', paddingRight: '10px', position: 'relative' }}>
        {/* 工具栏 */}
        <div style={{ flexShrink: 0, marginBottom: '10px', marginTop: '10px' }}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新增
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
                className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </motion.button>
            </div>
            <div className="text-sm text-gray-500">
              共 {dailyWorkData.length} 条记录
            </div>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* 滚动容器 */}
          <div className="overflow-y-auto overflow-x-auto" style={{ flex: 1, minHeight: 0 }}>
            <table style={{ width: '1800px' }}>
              <thead>
                <tr className="border-b sticky top-0 z-10" style={{ backgroundColor: '#F1F5F9' }}>
                  <th className="px-0 py-2 text-left text-sm font-normal text-gray-700 whitespace-nowrap w-10 sticky left-0 z-30 bg-[#F1F5F9]" style={{ backgroundColor: '#F1F5F9', margin: '0', padding: '0', paddingLeft: '10px', paddingRight: '10px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === paginatedData.length && paginatedData.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
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
                        <div className="flex flex-col items-center gap-3">
                          <FileText className="w-12 h-12 text-gray-300" />
                          <p>暂无数据，请导入文件或手动添加</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((data, index) => (
                      <motion.tr
                        key={data.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.02 }}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-0 py-3 w-10 sticky left-0 z-30 bg-white" style={{ margin: '0', padding: '0', paddingLeft: '10px', paddingRight: '10px' }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(data.id)}
                            onChange={(e) => handleSelectOne(data.id, e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                          />
                        </td>
                        {FIELDS.map((field, index) => (
                          <td key={field.key} className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            <span className="font-medium text-gray-700">{data[field.key] || '-'}</span>
                          </td>
                        ))}
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 分页器 */}
        {totalPages > 1 && (
          <div style={{ position: 'absolute', left: '10px', right: '10px', bottom: '0', height: '50px' }} className="py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
                <div className="text-sm text-gray-500">
                  已选{selectedIds.length}条/共{sortedData.length}条
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                          ? 'bg-blue-500 text-white'
                          : 'border border-gray-300 hover:bg-white'
                      }`}
                    >
                      {page}
                    </motion.button>
                  ))}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      跳转
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

      {/* 导入CSV弹窗 */}
      {showImportModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImportModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-4">导入</h3>
            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleImport}
                  className="w-full px-4 py-3 border border-gray-300 rounded text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition-all text-sm"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownloadTemplate}
                className="w-full px-4 py-2 border border-blue-500 rounded text-blue-500 hover:bg-blue-50 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                下载导入模板
              </motion.button>
              <p className="text-sm text-gray-500">
                支持 Excel 和 CSV 格式，建议先下载模板再导入
              </p>
              <div className="flex gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  取消
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg w-full max-w-sm p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-4">确认删除</h3>
            <p className="text-gray-600 mb-6">
              确定要删除选中的 {selectedIds.length} 条记录吗？此操作不可恢复。
            </p>
            <div className="flex gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 rounded text-white font-medium hover:bg-red-600 transition-colors"
              >
                删除
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 添加记录弹窗 */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg w-full max-w-6xl p-6 max-h-[90vh] overflow-y-auto shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-6">添加每日功课记录</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {FIELDS.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm text-gray-600 mb-1.5">{field.label}</label>
                    {field.key === 'date' ? (
                      <input
                        type="date"
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        max={format(new Date(), 'yyyy-MM-dd')}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                      />
                    ) : field.key === 'sentiment' ? (
                      <select
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                      >
                        <option value="">请选择</option>
                        <option value="冰点">冰点</option>
                        <option value="过冷">过冷</option>
                        <option value="微冷">微冷</option>
                        <option value="微热">微热</option>
                        <option value="过热">过热</option>
                        <option value="沸点">沸点</option>
                      </select>
                    ) : field.key === 'prediction' ? (
                      <select
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                      >
                        <option value="">请选择</option>
                        <option value="看涨">看涨</option>
                        <option value="看跌">看跌</option>
                      </select>
                    ) : field.key === 'tradeStatus' ? (
                      <select
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                      >
                        <option value="">请选择</option>
                        <option value="积极地">积极地</option>
                        <option value="保守地">保守地</option>
                        <option value="防御地">防御地</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  取消
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-2 bg-blue-500 rounded text-white font-medium hover:bg-blue-600 transition-colors"
                >
                  保存
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default DailyWork
