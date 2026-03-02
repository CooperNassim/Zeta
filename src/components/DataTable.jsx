import React from 'react'
import { motion } from 'framer-motion'

const DataTable = ({
  fields,
  data,
  selectedIds,
  onSelectAll,
  onSelectOne,
  emptyStateProps = {},
  renderCell = null
}) => {
  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectAll(data.map(d => d.id))
    } else {
      onSelectAll([])
    }
  }

  return (
    <table style={{ width: '1800px' }}>
      <thead>
        <tr className="border-b sticky top-0" style={{ backgroundColor: '#F1F5F9', zIndex: '20' }}>
          <th className="px-0 py-2 text-left text-sm font-normal text-gray-700 whitespace-nowrap w-10 sticky left-0 bg-[#F1F5F9]" style={{ backgroundColor: '#F1F5F9', margin: '0', padding: '0', paddingLeft: '10px', paddingRight: '10px', zIndex: '30' }}>
            <input
              type="checkbox"
              checked={selectedIds.length === data.length && data.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              style={{ position: 'relative', zIndex: '1' }}
            />
          </th>
          {fields.map((field, index) => (
            <th key={field.key} className="px-4 py-2 text-left text-sm font-normal text-gray-700 whitespace-nowrap" style={{ backgroundColor: '#F1F5F9' }}>
              {field.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={fields.length + 1} className="px-0 py-4 text-center text-gray-500 text-sm">
              <emptyStateProps.Component {...emptyStateProps.props} />
            </td>
          </tr>
        ) : (
          <>
            {data.map((item, index) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-0 py-3 w-10 sticky left-0 bg-white" style={{ margin: '0', padding: '0', paddingLeft: '10px', paddingRight: '10px', zIndex: '10' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={(e) => onSelectOne(item.id, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    style={{ position: 'relative', zIndex: '1' }}
                  />
                </td>
                {fields.map((field, index) => (
                  <td key={field.key} className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {renderCell ? (
                      renderCell(field, item) || <span className="font-medium text-gray-700">{item[field.key] || '-'}</span>
                    ) : (
                      <span className="font-medium text-gray-700">{item[field.key] || '-'}</span>
                    )}
                  </td>
                ))}
              </motion.tr>
            ))}
          </>
        )}
      </tbody>
    </table>
  )
}

export default DataTable
