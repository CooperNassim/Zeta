import React from 'react'

const ReadOnlyInput = ({ value, placeholder = '', className = '' }) => {
  return (
    <input
      type="text"
      value={value || ''}
      readOnly
      className={`w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded text-gray-600 text-sm ${className}`}
      placeholder={placeholder}
      disabled
    />
  )
}

export default ReadOnlyInput
