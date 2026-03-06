import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, RefreshCw, TrendingUp, TrendingDown, Search, Loader2 } from 'lucide-react'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import OrderModal from '../components/OrderModal'
import Toast from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'
import EmptyState from '../components/EmptyState'
import useStore from '../store/useStore'
import { getMultipleStocksRealtime, searchStock } from '../utils/stockApi'
import { calculateKlineBollingerBands } from '../utils/technicalIndicators'

const StockPool = () => {
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastType, setToastType] = useState('success')
  const [toastMessage, setToastMessage] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [editingStock, setEditingStock] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    market: 'cn',
    exchange: '',
    sector: ''
  })
  const pageSize = 20

  const stockPool = useStore(state => state.stockPool)
  const stockKlineData = useStore(state => state.stockKlineData)
  const updateStockKlineData = useStore(state => state.updateStockKlineData)
  const addStock = useStore(state => state.addStock)
  const updateStock = useStore(state => state.updateStock)
  const deleteStock = useStore(state => state.deleteStock)
  const deleteMultipleStocks = useStore(state => state.deleteMultipleStocks)

  // 股票池搜索（在线搜索）
  const handleOnlineSearch = async (keyword) => {
    if (!keyword) {
      setSearchResults([])
      setShowSearchDropdown(false)
      return
    }

    try {
      const results = await searchStock(keyword)
      setSearchResults(results)
      setShowSearchDropdown(true)
    } catch (error) {
      console.error('搜索失败:', error)
    }
  }

  // 选择搜索结果中的股票
  const handleSelectSearchResult = (stock) => {
    setFormData({
      ...formData,
      symbol: stock.symbol,
      name: stock.name,
      market: stock.market === 'sh' ? 'cn' : 'cn',
      exchange: stock.exchange,
      sector: stock.sector || ''
    })
    setShowSearchDropdown(false)
    setSearchResults([])
  }

  // 更新股票数据
  const handleRefreshData = async () => {
    if (stockPool.length === 0) {
      setToastMessage('股票池为空')
      setToastType('error')
      setShowToast(true)
      return
    }

    setIsUpdating(true)
    try {
      const symbols = stockPool.map(s => s.symbol)

      // 获取实时数据
      const realtimeData = await getMultipleStocksRealtime(symbols)

      // 更新每个股票的信息
      realtimeData.forEach(data => {
        const stock = stockPool.find(s => s.symbol === data.symbol)
        if (stock) {
          updateStock(stock.id, {
            currentPrice: data.currentPrice,
            change: data.change,
            changePercent: data.changePercent,
            openPrice: data.openPrice,
            highPrice: data.highPrice,
            lowPrice: data.lowPrice,
            prevClose: data.prevClose,
            volume: data.volume,
            amount: data.amount,
            updatedAt: data.time
          })
        }
      })

      setToastMessage('数据更新成功')
      setToastType('success')
    } catch (error) {
      console.error('更新失败:', error)
      setToastMessage('数据更新失败')
      setToastType('error')
    } finally {
      setIsUpdating(false)
      setShowToast(true)
    }
  }

  // 筛选股票
  const filteredStocks = stockPool.filter(stock => {
    if (!searchKeyword) return true
    const keyword = searchKeyword.toLowerCase()
    return (
      stock.symbol.toLowerCase().includes(keyword) ||
      stock.name.toLowerCase().includes(keyword) ||
      stock.sector.toLowerCase().includes(keyword)
    )
  })

  const totalPages = Math.ceil(filteredStocks.length / pageSize)
  const paginatedData = filteredStocks.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleAddStock = () => {
    setEditingStock(null)
    setFormData({
      symbol: '',
      name: '',
      market: 'us',
      exchange: '',
      sector: ''
    })
    setShowModal(true)
  }

  const handleEditStock = (stock) => {
    setEditingStock(stock)
    setFormData({
      symbol: stock.symbol,
      name: stock.name,
      market: stock.market,
      exchange: stock.exchange,
      sector: stock.sector
    })
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.symbol.trim() || !formData.name.trim()) {
      setToastType('error')
      setToastMessage('请填写完整的股票信息')
      setShowToast(true)
      return
    }

    if (editingStock) {
      updateStock(editingStock.id, formData)
      setToastMessage('股票信息更新成功')
    } else {
      addStock(formData)
      setToastMessage('股票添加成功')
    }

    setToastType('success')
    setShowToast(true)
    setShowModal(false)
  }

  const confirmDelete = () => {
    deleteMultipleStocks(selectedIds)
    setToastMessage('删除成功')
    setToastType('success')
    setShowToast(true)
    setShowDeleteModal(false)
    setSelectedIds([])
    setCurrentPage(1)
  }

  useEffect(() => {
    setCurrentPage(1)
    setSelectedIds([])
  }, [searchKeyword])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '10px', paddingRight: '10px', position: 'relative', paddingBottom: '10px' }}>
        {/* 内容区域 */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* 工具栏 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={handleAddStock}
                className="px-4 py-2 bg-[#0F1419] border-0 rounded text-white hover:opacity-90 transition-opacity text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-white" />
                添加股票
              </button>
              <button
                onClick={handleRefreshData}
                disabled={isUpdating}
                className={`px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    更新中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    更新数据
                  </>
                )}
              </button>
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-red-500 hover:text-red-500 transition-colors text-sm flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  删除选中 ({selectedIds.length})
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索股票代码/名称/行业"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 36px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    width: '300px',
                    outline: 'none'
                  }}
                />
              </div>
              <span style={{ color: '#666', fontSize: '14px' }}>
                共 {filteredStocks.length} 只股票
              </span>
            </div>
          </div>

          {/* 表格 */}
          {paginatedData.length > 0 ? (
            <DataTable
              fields={[
                { key: 'symbol', label: '股票代码', width: '120px' },
                { key: 'name', label: '股票名称', width: '150px' },
                { key: 'market', label: '市场', width: '80px' },
                { key: 'exchange', label: '交易所', width: '120px' },
                { key: 'sector', label: '行业', width: '120px' },
                { key: 'currentPrice', label: '当前价格', width: '100px' },
                { key: 'changePercent', label: '涨跌幅', width: '100px' },
                { key: 'volume', label: '成交量', width: '120px' },
                { key: 'updatedAt', label: '更新时间', width: '180px' },
                { key: 'actions', label: '操作', width: '150px' }
              ]}
              data={paginatedData}
              selectedIds={selectedIds}
              onSelectAll={(ids) => setSelectedIds(ids)}
              onSelectOne={(id, checked) => {
                if (checked) {
                  setSelectedIds([...selectedIds, id])
                } else {
                  setSelectedIds(selectedIds.filter(selectedId => selectedId !== id))
                }
              }}
              renderCell={(field, item) => {
                if (field.key === 'market') {
                  const marketMap = {
                    'us': '美股',
                    'hk': '港股',
                    'cn': 'A股'
                  }
                  return marketMap[item.market] || item.market
                }
                if (field.key === 'currentPrice') {
                  return item.currentPrice ? `$${item.currentPrice.toFixed(2)}` : '-'
                }
                if (field.key === 'changePercent') {
                  if (item.changePercent === undefined || item.changePercent === null) return '-'
                  const isPositive = item.changePercent >= 0
                  return (
                    <span style={{ color: isPositive ? '#16a34a' : '#dc2626' }}>
                      {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </span>
                  )
                }
                if (field.key === 'volume') {
                  return item.volume ? (item.volume / 10000).toFixed(2) + '万' : '-'
                }
                if (field.key === 'updatedAt') {
                  return item.updatedAt ? new Date(item.updatedAt).toLocaleString('zh-CN') : '-'
                }
                if (field.key === 'actions') {
                  return (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditStock(item)
                        }}
                        className="p-1 hover:bg-blue-50 rounded transition-colors"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4 text-blue-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteStock(item.id)
                          setToastMessage('删除成功')
                          setToastType('success')
                          setShowToast(true)
                        }}
                        className="p-1 hover:bg-red-50 rounded transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  )
                }
                return null
              }}
            />
          ) : (
            <EmptyState
              message={searchKeyword ? '未找到匹配的股票' : '暂无股票数据'}
              icon={searchKeyword ? Search : TrendingUp}
            />
          )}
        </div>

        {/* 分页器 */}
        <div style={{ position: 'absolute', right: '0', bottom: '0', height: '50px', zIndex: '10', width: '100%' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            selectedCount={selectedIds.length}
            totalCount={filteredStocks.length}
          />
        </div>
      </div>

      {/* 添加/编辑股票弹窗 */}
      <OrderModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingStock ? '编辑股票' : '添加股票'}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px', position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                股票代码 * <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 'normal' }}>(可搜索)</span>
              </label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => {
                  setFormData({ ...formData, symbol: e.target.value })
                  handleOnlineSearch(e.target.value)
                }}
                onFocus={() => {
                  if (formData.symbol) {
                    handleOnlineSearch(formData.symbol)
                  }
                }}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                placeholder="输入代码或名称搜索，如：平安银行或000001"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              {showSearchDropdown && searchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  marginTop: '4px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  zIndex: 100,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  {searchResults.map((stock, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectSearchResult(stock)}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        borderBottom: index < searchResults.length - 1 ? '1px solid #f3f4f6' : 'none',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.target.style.background = 'white'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 'bold', color: '#374151' }}>{stock.name}</span>
                          <span style={{ color: '#9ca3af', marginLeft: '8px' }}>{stock.symbol}</span>
                        </div>
                        <span style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#f3f4f6',
                          color: '#6b7280'
                        }}>
                          {stock.exchange}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                股票名称 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：苹果"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                市场
              </label>
              <select
                value={formData.market}
                onChange={(e) => setFormData({ ...formData, market: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="cn">A股</option>
                <option value="hk">港股</option>
                <option value="us">美股</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                交易所
              </label>
              <input
                type="text"
                value={formData.exchange}
                onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
                placeholder="例如：NASDAQ"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                行业
              </label>
              <input
                type="text"
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                placeholder="例如：科技"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors text-sm"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0F1419] border-0 rounded text-white hover:opacity-90 transition-opacity text-sm"
              >
                {editingStock ? '保存' : '添加'}
              </button>
            </div>
          </div>
        </form>
      </OrderModal>

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="确认删除"
        message={`确定要删除选中的 ${selectedIds.length} 只股票吗？`}
      />

      {/* Toast提示 */}
      {showToast && (
        <Toast
          type={toastType}
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  )
}

export default StockPool
