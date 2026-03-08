import React from 'react'
import { Search, X } from 'lucide-react'

const SearchInput = ({
  value = '',
  onChange,
  placeholder = '搜索',
  width = '200px',
  onClear
}) => {
  const handleClear = () => {
    onChange('')
    if (onClear) {
      onClear()
    }
  }

  return (
    <div style={{ position: 'relative', width }} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 pr-16 border rounded focus:outline-none transition-colors text-sm border-gray-300"
        style={{
          color: value ? '#0F1419' : '#9ca3af'
        }}
      />
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
        {value && (
          <button
            onClick={handleClear}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            type="button"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
        <Search className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  )
}

export default SearchInput
