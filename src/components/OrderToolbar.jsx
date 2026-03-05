import React from 'react'
import { motion } from 'framer-motion'
import { Plus, Play, Ban, Trash2, DollarSign, Download } from 'lucide-react'

const OrderToolbar = ({ onAdd, onExecute, onCancel, onDelete, onSell, onExport, canExecute, canCancel, canDelete, canSell, canExport, totalCount }) => {
  return (
    <div style={{ flexShrink: 0, marginTop: '10px', marginBottom: '10px' }}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            买入预约
          </button>
          <button
            onClick={onExecute}
            disabled={!canExecute}
            className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            执行买入
          </button>
          <button
            onClick={onSell}
            disabled={!canSell}
            className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <DollarSign className="w-4 h-4" />
            卖出清仓
          </button>
          <button
            onClick={onCancel}
            disabled={!canCancel}
            className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Ban className="w-4 h-4" />
            作废订单
          </button>
          <button
            onClick={onExport}
            disabled={!canExport}
            className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
          <button
            onClick={onDelete}
            disabled={!canDelete}
            className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>
        </div>
        <div className="text-sm text-gray-500">
          共 {totalCount} 条记录
        </div>
      </div>
    </div>
  )
}

export default OrderToolbar
