import React from 'react'

const CustomInput = ({ value, onChange, placeholder = '请输入', className = '', error = false, type = 'text', rows, ...props }) => {
  if (type === 'textarea') {
    return (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded focus:outline-none transition-colors text-sm resize-none ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
        placeholder={placeholder}
        style={{ color: value ? '#1f2937' : '#9ca3af' }}
        rows={rows || 2}
        {...props}
      />
    )
  }

  return (
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 border rounded focus:outline-none transition-colors text-sm ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
      placeholder={placeholder}
      style={{ color: value ? '#1f2937' : '#9ca3af' }}
      {...props}
    />
  )
}

export default CustomInput
