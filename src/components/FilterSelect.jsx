import React from 'react'

const FilterSelect = ({ value, onChange, options, className = '', placeholder = '全部', label = '' }) => {
  return (
    <div className={className} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '6px'
        }}>
          {label}
        </label>
      )}
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded focus:outline-none transition-colors appearance-none text-sm border-gray-300"
        style={{
          color: value ? '#1f2937' : '#9ca3af',
          cursor: 'pointer',
          backgroundColor: '#FFFFFF',
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
          paddingRight: '2.5rem'
        }}
      >
        {placeholder && (
          <option value="" style={{ color: '#1f2937' }}>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} style={{ color: '#1f2937' }}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default FilterSelect
