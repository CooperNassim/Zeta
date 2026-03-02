import React, { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'

const CustomDatePicker = ({ value, onChange, placeholder = '日期', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = React.useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDateClick = (date) => {
    onChange(date)
    setIsOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setIsOpen(false)
  }

  const generateCalendar = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDay = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days = []
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const isSelected = value === dateStr
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(dateStr)}
          className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-colors ${
            isSelected
              ? 'bg-[#0F1419] text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          {day}
        </button>
      )
    }
    return days
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-blue-500 transition-colors text-sm cursor-pointer flex items-center justify-between w-full"
      >
        <span style={{ color: value ? '#1f2937' : '#9ca3af' }}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-2">
          {value && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="清空"
            >
              ✕
            </button>
          )}
          <Calendar className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      {isOpen && (
        <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50" style={{ width: '280px' }}>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700">
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div key={day} className="w-8 h-8 flex items-center justify-center text-xs text-gray-500">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {generateCalendar()}
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomDatePicker
