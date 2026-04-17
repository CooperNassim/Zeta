import React from 'react'
import { motion } from 'framer-motion'

const DataTable = ({
  fields,
  data = [], // 默认值设为空数组
  selectedIds = [],
  onSelectAll,
  onSelectOne,
  emptyStateProps,
  renderCell,
  showCheckbox = true // 添加showCheckbox参数，默认为true
}) => {
  const handleSelectAll = (e) => {
    const checked = e.target.checked
    if (checked && data) {
      onSelectAll(data.map(d => d.id))
    } else {
      onSelectAll([])
    }
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr className="border-b" style={{ backgroundColor: '#F4F5F7' }}>
          {showCheckbox && (
            <th className="px-0 py-2 text-left text-sm font-normal text-gray-700 whitespace-nowrap w-10 bg-[#F4F5F7]" style={{ backgroundColor: '#F4F5F7', margin: '0', padding: '0', paddingLeft: '10px', paddingRight: '10px' }}>
              <input
                type="checkbox"
                checked={data.length > 0 && Array.isArray(selectedIds) && selectedIds.length === data.length}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                style={{ position: 'relative', zIndex: '1' }}
              />
            </th>
          )}
          {fields.filter(field => !field.hideInTable).map((field, index) => (
            <th key={field.key} className="px-4 py-2 text-left text-sm font-normal text-gray-700 whitespace-nowrap" style={{ backgroundColor: '#F4F5F7', width: field.width || 'auto' }}>
              {field.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={fields.filter(field => !field.hideInTable).length + (showCheckbox ? 1 : 0)}>
              <div className="py-8">
                {emptyStateProps?.Component ? (
                  <emptyStateProps.Component {...emptyStateProps.props} />
                ) : (
                  <div className="text-center text-gray-500">暂无数据</div>
                )}
              </div>
            </td>
          </tr>
        ) : (
          data.map((item, index) => (
            <motion.tr
              key={item.id || index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
              className="border-b hover:bg-gray-50"
            >
              {showCheckbox && (
                <td className="px-0 py-2 text-left text-sm text-gray-700 whitespace-nowrap w-10 bg-white" style={{ margin: '0', padding: '0', paddingLeft: '10px', paddingRight: '10px', backgroundColor: 'white' }}>
                  <input
                    type="checkbox"
                    checked={Array.isArray(selectedIds) && selectedIds.includes(item.id)}
                    onChange={(e) => onSelectOne(item.id, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    style={{ position: 'relative', zIndex: '1' }}
                  />
                </td>
              )}
              {fields.filter(field => !field.hideInTable).map((field, fieldIndex) => (
                <td 
                  key={field.key} 
                  className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap bg-white"
                  style={{ 
                    width: field.width || 'auto', 
                    backgroundColor: 'white'
                  }}
                >
                  {renderCell ? renderCell(field, item) : item[field.key]}
                </td>
              ))}
            </motion.tr>
          ))
        )}
      </tbody>
    </table>
  )
}

export default DataTable