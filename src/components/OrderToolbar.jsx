import React from 'react'
import { motion } from 'framer-motion'
import { Plus, Play, Ban, Trash2 } from 'lucide-react'

const OrderToolbar = ({ onAdd, onExecute, onCancel, onDelete, canExecute, canCancel, canDelete, totalCount }) => {
  return (
    <div style={{ flexShrink: 0, marginTop: '10px', marginBottom: '10px' }}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={onAdd}
            style={{
              padding: '8px 20px',
              background: '#0F1419',
              border: '1px solid #0F1419',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus className="w-4 h-4" />
            预约订单
          </button>
          <button
            onClick={onExecute}
            disabled={!canExecute}
            style={{
              padding: '8px 20px',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              color: '#374151',
              fontSize: '14px',
              cursor: canExecute ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              opacity: canExecute ? 1 : 0.4,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Play className="w-4 h-4" />
            执行订单
          </button>
          <button
            onClick={onCancel}
            disabled={!canCancel}
            style={{
              padding: '8px 20px',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              color: '#374151',
              fontSize: '14px',
              cursor: canCancel ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              opacity: canCancel ? 1 : 0.4,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Ban className="w-4 h-4" />
            作废订单
          </button>
          <button
            onClick={onDelete}
            disabled={!canDelete}
            style={{
              padding: '8px 20px',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              color: '#374151',
              fontSize: '14px',
              cursor: canDelete ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              opacity: canDelete ? 1 : 0.4,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
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
