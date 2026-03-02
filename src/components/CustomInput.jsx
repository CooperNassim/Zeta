import React from 'react'

const CustomInput = ({ value, onChange, placeholder = '请输入', className = '', error = false, type = 'text', ...props }) => {
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
