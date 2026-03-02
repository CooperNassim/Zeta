import React from 'react'
import Modal from './Modal'

const ExportModal = ({
  isOpen,
  onClose,
  onConfirm,
  exportFormat,
  onFormatChange,
  totalCount
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="导出"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
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
              onChange={(e) => onFormatChange(e.target.value)}
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
              onChange={(e) => onFormatChange(e.target.value)}
              className="w-4 h-4"
              style={{ accentColor: '#0F1419' }}
            />
            <span className="text-sm text-gray-700">.csv</span>
          </label>
        </div>
        <p className="text-sm text-gray-500">
          共 {totalCount} 条记录
        </p>
      </div>
    </Modal>
  )
}

export default ExportModal
