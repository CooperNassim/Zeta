import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const OrderModal = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg w-full max-w-2xl p-5 shadow-lg"
            style={{ maxHeight: 'calc(100vh - 80px)' }}
            onClick={(e) => e.stopPropagation()}
          >
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="mb-2 overflow-auto flex-1" style={{ maxHeight: 'calc(100vh - 160px)' }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  )
}

export default OrderModal
