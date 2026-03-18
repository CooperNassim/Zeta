import React from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Play, Pause, Upload, Download, Trash2 } from 'lucide-react'

const Toolbar = ({ onAdd, onEdit, onEnable, onDisable, onImport, onExport, onDelete, canEdit, canEnable, canDisable, canExport, canDelete, totalCount, hideAdd, hideImport, hideDelete, editLabel }) => {
  return (
    <div style={{ flexShrink: 0, margin: '10px 0', paddingLeft: '1px' }}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex gap-2" style={{ gap: '10px' }}>
            {!hideAdd && onAdd && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAdd}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新增
              </motion.button>
            )}
            {onEdit && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onEdit}
                disabled={!canEdit}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Edit className="w-4 h-4" />
                {editLabel || '编辑'}
              </motion.button>
            )}
            {onEnable && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onEnable}
                disabled={!canEnable}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                启用
              </motion.button>
            )}
            {onDisable && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onDisable}
                disabled={!canDisable}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Pause className="w-4 h-4" />
                停用
              </motion.button>
            )}
            {!hideImport && onImport && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onImport}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                导入
              </motion.button>
            )}
            {onExport && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onExport}
                disabled={!canExport}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                导出
              </motion.button>
            )}
            {!hideDelete && onDelete && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onDelete}
                disabled={!canDelete}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </motion.button>
            )}
          </div>
          <div className="text-sm text-gray-500">
            共 {totalCount} 条记录
          </div>
        </div>
    </div>
  )
}

export default Toolbar
