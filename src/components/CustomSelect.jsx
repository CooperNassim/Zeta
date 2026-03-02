import React from 'react'

const CustomSelect = ({ value, onChange, options, placeholder = '请选择', className = '', error = false }) => {
  return (
    <div style={{ position: 'relative', width: '100%' }} className={className}>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded text-gray-700 focus:outline-none transition-colors appearance-none text-sm ${error ? 'border-red-500' : 'border-gray-300'}`}
        style={{
          color: value ? '#1f2937' : '#9ca3af',
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
          paddingRight: '2.5rem'
        }}
      >
        <option value="" style={{ color: '#9ca3af' }}>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} style={{ color: '#1f2937' }}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default CustomSelect
