import React from 'react'
import { motion } from 'framer-motion'

const Pagination = ({ currentPage, totalPages, onPageChange, selectedCount, totalCount }) => {
  const [jumpToPage, setJumpToPage] = React.useState(currentPage)

  React.useEffect(() => {
    setJumpToPage(currentPage)
  }, [currentPage])

  if (totalPages < 0) return null

  return (
    <div className="py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-4 px-4 h-full">
      <div className="text-sm text-gray-500">
        已选{selectedCount}条/共{totalCount}条
      </div>
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onPageChange(currentPage - 1)}
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
            onClick={() => onPageChange(page)}
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
          onClick={() => onPageChange(currentPage + 1)}
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
                onPageChange(jumpToPage)
              }
            }}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-center"
          />
          <span className="text-sm text-gray-500">页</span>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPageChange(jumpToPage)}
            disabled={jumpToPage === currentPage}
            className="px-3 py-1.5 text-sm rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ backgroundColor: '#0F1419', color: '#ffffff' }}
          >
            跳转
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default Pagination
