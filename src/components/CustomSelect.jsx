import React from 'react'

const CustomSelect = ({ value, onChange, options, placeholder = '请选择', className = '', error = false }) => {
  return (
    <div style={{ position: 'relative', width: '100%' }} className={className}>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded text-gray-700 focus:outline-none transition-colors appearance-none text-sm ${error ? 'border-red-500' : 'border-gray-300'}`}
        style={{
          color: value ? '#1f2937' : '#9ca3af'
        }}
      >
        <option value="" style={{ color: '#9ca3af' }}>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} style={{ color: '#1f2937' }}>
            {option.label}
          </option>
        ))}
      </select>
      <div style={{
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        color: '#9ca3af'
      }}>
        ▼
      </div>
    </div>
  )
}

export default CustomSelect
