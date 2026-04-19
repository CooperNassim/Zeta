import React from 'react'

const ReadOnlyInput = ({ value, placeholder = '', className = '' }) => {
  const displayValue = (value === null || value === undefined || value === '') ? '-' : value
  return (
    <input
      type="text"
      value={displayValue}
      readOnly
      className={`w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded text-gray-600 text-sm ${className}`}
      placeholder={placeholder}
      disabled
    />
  )
}

export default ReadOnlyInput
