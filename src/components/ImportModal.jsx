import React from 'react'
import Modal from './Modal'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import ErrorMessage from './ErrorMessage'

const ImportModal = ({
  isOpen,
  onClose,
  onConfirm,
  onDownloadTemplate,
  onDownloadError,
  importFile,
  onFileChange,
  importResult,
  importFileError,
  errorWorkbook
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="导入"
      footer={
        <div className="flex items-center justify-between w-full">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDownloadTemplate}
            className="px-3 py-2 border rounded transition-colors text-sm flex items-center gap-2"
            style={{ borderColor: '#0F1419', color: '#0F1419' }}
          >
            <Download className="w-4 h-4" />
            导入模板
          </motion.button>
          <div className="flex gap-2">
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
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={onFileChange}
            className={`w-full px-4 py-3 border rounded text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-white hover:file:opacity-90 transition-all text-sm ${importFileError ? 'border-red-500' : 'border-gray-300'}`}
          />
          {importFileError && (
            <ErrorMessage />
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
                onClick={onDownloadError}
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
  )
}

export default ImportModal
