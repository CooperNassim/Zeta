import React, { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'

const DateRangePicker = ({ value, onChange, placeholder = '日期区间', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [calendarDate, setCalendarDate] = useState(new Date())
  const ref = React.useRef(null)

  useEffect(() => {
    if (value && value.includes('~')) {
      const [start, end] = value.split('~')
      setStartDate(start)
      setEndDate(end)
    } else {
      setStartDate('')
      setEndDate('')
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDateClick = (dateStr) => {
    if (!startDate) {
      setStartDate(dateStr)
    } else if (!endDate) {
      if (new Date(dateStr) >= new Date(startDate)) {
        setEndDate(dateStr)
      } else {
        setStartDate(dateStr)
        setEndDate(startDate)
      }
    } else {
      setStartDate(dateStr)
      setEndDate('')
    }
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setStartDate('')
    setEndDate('')
    onChange('')
    setIsOpen(false)
  }

  const handleConfirm = () => {
    if (startDate && endDate) {
      onChange(`${startDate}~${endDate}`)
      setIsOpen(false)
    } else if (startDate) {
      onChange(`${startDate}~${startDate}`)
      setIsOpen(false)
    }
  }

  const handleReset = () => {
    setStartDate('')
    setEndDate('')
  }

  const changeMonth = (delta) => {
    const newDate = new Date(calendarDate)
    newDate.setMonth(newDate.getMonth() + delta)
    setCalendarDate(newDate)
  }

  const generateCalendar = () => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
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
      const isStartDate = startDate === dateStr
      const isEndDate = endDate === dateStr
      const isInRange = startDate && endDate && new Date(dateStr) > new Date(startDate) && new Date(dateStr) < new Date(endDate)
      const isDisabled = startDate && !endDate && new Date(dateStr) < new Date(startDate)

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(dateStr)}
          disabled={isDisabled}
          className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-colors ${
            isStartDate || isEndDate
              ? 'bg-[#0F1419] text-white'
              : isInRange
              ? 'bg-[#0F1419] bg-opacity-20 text-gray-700'
              : isDisabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          {day}
        </button>
      )
    }
    return days
  }

  const displayValue = value || (startDate && endDate ? `${startDate}~${endDate}` : (startDate ? `${startDate}~${startDate}` : ''))

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 border border-gray-300 rounded text-gray-700 focus:outline-none focus:border-blue-500 transition-colors text-sm cursor-pointer flex items-center justify-between w-full"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <span style={{ color: displayValue ? '#1f2937' : '#9ca3af' }}>
          {displayValue || placeholder}
        </span>
        <div className="flex items-center gap-2">
          {displayValue && (
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
        <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50" style={{ width: '320px' }}>
          {/* 月份导航 */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-gray-700">
              {calendarDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ›
            </button>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div key={day} className="w-8 h-8 flex items-center justify-center text-xs text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* 日期格子 */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {generateCalendar()}
          </div>

          {/* 已选日期显示 */}
          {startDate && (
            <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
              <div className="text-gray-600 mb-1">已选日期：</div>
              <div className="font-medium text-gray-700">
                {startDate}
                {endDate && ` ~ ${endDate}`}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors text-sm"
            >
              重置
            </button>
            <button
              onClick={handleConfirm}
              disabled={!startDate}
              className="flex-1 px-3 py-2 bg-[#0F1419] text-white rounded hover:opacity-90 transition-opacity text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DateRangePicker
