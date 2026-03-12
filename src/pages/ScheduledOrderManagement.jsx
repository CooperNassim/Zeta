import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Bell, Trash2, Play, Pause } from 'lucide-react'
import { format } from 'date-fns'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import OrderToolbar from '../components/OrderToolbar'
import EmptyState from '../components/EmptyState'
import Toast from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'
import FilterSelect from '../components/FilterSelect'

// 使用相对路径，通过 Vite 代理到后端
const API_BASE_URL = ''

const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    }
    if (data) options.body = JSON.stringify(data)
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options)
    return await response.json()
  } catch (error) {
    console.error('API调用失败:', error)
    return { success: false, error: error.message }
  }
}

const conditionTypes = [
  { value: 'price_above', label: '价格高于' },
  { value: 'price_below', label: '价格低于' },
  { value: 'price_break', label: '价格突破' },
  { value: 'time', label: '定时执行' }
]

const statusOptions = [
  { value: 'pending', label: '待触发', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { value: 'triggered', label: '已触发', color: 'text-blue-600', bg: 'bg-blue-100' },
  { value: 'executed', label: '已执行', color: 'text-green-600', bg: 'bg-green-100' },
  { value: 'cancelled', label: '已取消', color: 'text-gray-600', bg: 'bg-gray-100' },
  { value: 'expired', label: '已过期', color: 'text-red-600', bg: 'bg-red-100' }
]

const ScheduledOrderManagement = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastType, setToastType] = useState('success')
  const [toastMessage, setToastMessage] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [selectedFilter, setSelectedFilter] = useState('pending')
  const [selectedIds, setSelectedIds] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  const [orderForm, setOrderForm] = useState({
    symbol: '',
    name: '',
    type: 'buy',
    condition_type: 'price_above',
    trigger_price: '',
    trigger_time: '',
    price: '',
    quantity: '',
    stop_loss_price: '',
    take_profit_price: '',
    expire_time: '',
    notes: ''
  })

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    const result = await apiCall('/api/scheduled_orders')
    if (result.success) {
      setOrders(result.data || [])
    }
    setLoading(false)
  }

  const handleAddOrder = () => {
    setOrderForm({
      symbol: '',
      name: '',
      type: 'buy',
      condition_type: 'price_above',
      trigger_price: '',
      trigger_time: '',
      price: '',
      quantity: '',
      stop_loss_price: '',
      take_profit_price: '',
      expire_time: '',
      notes: ''
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!orderForm.symbol || !orderForm.price || !orderForm.quantity) {
      setToastType('error')
      setToastMessage('请填写必要信息')
      setShowToast(true)
      return
    }

    const orderId = 'SO' + Date.now()
    const data = {
      order_id: orderId,
      symbol: orderForm.symbol,
      name: orderForm.name || orderForm.symbol,
      type: orderForm.type,
      condition_type: orderForm.condition_type,
      trigger_price: orderForm.trigger_price ? parseFloat(orderForm.trigger_price) : null,
      trigger_time: orderForm.trigger_time || null,
      price: parseFloat(orderForm.price),
      quantity: parseInt(orderForm.quantity),
      stop_loss_price: orderForm.stop_loss_price ? parseFloat(orderForm.stop_loss_price) : null,
      take_profit_price: orderForm.take_profit_price ? parseFloat(orderForm.take_profit_price) : null,
      expire_time: orderForm.expire_time || null,
      notes: orderForm.notes,
      status: 'pending'
    }

    const result = await apiCall('/api/scheduled_orders', 'POST', data)
    if (result.success) {
      setShowModal(false)
      fetchOrders()
      setToastType('success')
      setToastMessage('预约订单创建成功')
    } else {
      setToastType('error')
      setToastMessage(result.error || '创建失败')
    }
    setShowToast(true)
  }

  const handleDelete = (id) => {
    setDeleteId(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    const result = await apiCall(`/api/scheduled_orders/${deleteId}`, 'DELETE')
    if (result.success) {
      fetchOrders()
      setToastType('success')
      setToastMessage('删除成功')
    } else {
      setToastType('error')
      setToastMessage(result.error || '删除失败')
    }
    setShowToast(true)
    setShowDeleteModal(false)
    setDeleteId(null)
  }

  const handleCancel = async (id) => {
    const result = await apiCall(`/api/scheduled_orders/${id}`, 'PUT', { status: 'cancelled' })
    if (result.success) {
      fetchOrders()
      setToastType('success')
      setToastMessage('取消成功')
    } else {
      setToastType('error')
      setToastMessage(result.error || '操作失败')
    }
    setShowToast(true)
  }

  const filteredOrders = orders.filter(o => {
    if (selectedFilter === 'all') return true
    return o.status === selectedFilter
  })

  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0]
  }

  const getConditionLabel = (type) => {
    return conditionTypes.find(c => c.value === type)?.label || type
  }

  const columns = [
    {
      key: 'symbol',
      header: '股票代码',
      render: (order) => (
        <div className="flex items-center">
          {order.type === 'buy' ? (
            <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500 mr-2" />
          )}
          <span className="font-medium">{order.symbol}</span>
        </div>
      )
    },
    { key: 'name', header: '股票名称' },
    {
      key: 'type',
      header: '类型',
      render: (order) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${order.type === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {order.type === 'buy' ? '买入' : '卖出'}
        </span>
      )
    },
    {
      key: 'condition_type',
      header: '触发条件',
      render: (order) => (
        <span className="text-sm">{getConditionLabel(order.condition_type)} {order.trigger_price && `@${order.trigger_price}`}</span>
      )
    },
    {
      key: 'price',
      header: '下单价格',
      render: (order) => <span className="font-medium">¥{order.price}</span>
    },
    { key: 'quantity', header: '数量' },
    {
      key: 'status',
      header: '状态',
      render: (order) => {
        const info = getStatusInfo(order.status)
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${info.bg} ${info.color}`}>
            {info.label}
          </span>
        )
      }
    },
    {
      key: 'created_at',
      header: '创建时间',
      render: (order) => order.created_at ? format(new Date(order.created_at), 'yyyy-MM-dd HH:mm') : '-'
    },
    {
      key: 'actions',
      header: '操作',
      render: (order) => (
        <div className="flex items-center space-x-2">
          {order.status === 'pending' && (
            <>
              <button
                onClick={() => handleCancel(order.id)}
                className="p-1 text-gray-500 hover:text-yellow-600 transition-colors"
                title="取消"
              >
                <Pause className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(order.id)}
                className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pt-[52px] pl-[166px]">
      <div className="p-6">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">预约订单管理</h1>
          <p className="text-gray-500 mt-1">管理条件触发订单</p>
        </div>

        {/* 工具栏 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FilterSelect
                label="状态筛选"
                value={selectedFilter}
                onChange={setSelectedFilter}
                options={[
                  { value: 'all', label: '全部' },
                  ...statusOptions
                ]}
              />
              <span className="text-sm text-gray-500">
                共 {filteredOrders.length} 条预约订单
              </span>
            </div>
            <button
              onClick={handleAddOrder}
              className="flex items-center px-4 py-2 bg-[#0F1419] text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              创建预约订单
            </button>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <DataTable
            fields={columns}
            data={paginatedOrders}
            selectedIds={selectedIds}
            onSelectAll={(ids) => setSelectedIds(ids)}
            onSelectOne={(id, checked) => {
              if (checked) {
                setSelectedIds(prev => [...prev, id])
              } else {
                setSelectedIds(prev => prev.filter(i => i !== id))
              }
            }}
            showCheckbox={true}
            emptyStateProps={{
              Component: EmptyState,
              props: { message: '暂无预约订单' }
            }}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredOrders.length / pageSize)}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* 创建预约订单弹窗 */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">创建预约订单</h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">股票代码 *</label>
                    <input
                      type="text"
                      value={orderForm.symbol}
                      onChange={e => setOrderForm({ ...orderForm, symbol: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="如: 600519"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">股票名称</label>
                    <input
                      type="text"
                      value={orderForm.name}
                      onChange={e => setOrderForm({ ...orderForm, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="如: 贵州茅台"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">交易类型 *</label>
                    <select
                      value={orderForm.type}
                      onChange={e => setOrderForm({ ...orderForm, type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="buy">买入</option>
                      <option value="sell">卖出</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">触发条件 *</label>
                    <select
                      value={orderForm.condition_type}
                      onChange={e => setOrderForm({ ...orderForm, condition_type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {conditionTypes.map(ct => (
                        <option key={ct.value} value={ct.value}>{ct.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {orderForm.condition_type !== 'time' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      触发价格 {orderForm.condition_type === 'time' ? '' : '*'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={orderForm.trigger_price}
                      onChange={e => setOrderForm({ ...orderForm, trigger_price: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="当价格达到此值时触发"
                    />
                  </div>
                )}

                {orderForm.condition_type === 'time' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">触发时间 *</label>
                    <input
                      type="datetime-local"
                      value={orderForm.trigger_time}
                      onChange={e => setOrderForm({ ...orderForm, trigger_time: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">下单价格 *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={orderForm.price}
                      onChange={e => setOrderForm({ ...orderForm, price: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="实际下单价格"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">数量 *</label>
                    <input
                      type="number"
                      value={orderForm.quantity}
                      onChange={e => setOrderForm({ ...orderForm, quantity: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="股数"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">止损价格</label>
                    <input
                      type="number"
                      step="0.01"
                      value={orderForm.stop_loss_price}
                      onChange={e => setOrderForm({ ...orderForm, stop_loss_price: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">止盈价格</label>
                    <input
                      type="number"
                      step="0.01"
                      value={orderForm.take_profit_price}
                      onChange={e => setOrderForm({ ...orderForm, take_profit_price: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">过期时间</label>
                  <input
                    type="datetime-local"
                    value={orderForm.expire_time}
                    onChange={e => setOrderForm({ ...orderForm, expire_time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                  <textarea
                    value={orderForm.notes}
                    onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="可选备注"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-4 border-t">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-[#0F1419] text-white rounded-lg hover:bg-gray-800"
                >
                  创建
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="确认删除"
        message="确定要删除这条预约订单吗？此操作不可恢复。"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Toast提示 */}
      <Toast
        show={showToast}
        type={toastType}
        message={toastMessage}
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}

export default ScheduledOrderManagement
