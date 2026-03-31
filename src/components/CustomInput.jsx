import React, { useState } from 'react'

const CustomInput = ({ value, onChange, placeholder = '请输入', className = '', error = false, type = 'text', rows, ...props }) => {
  const [inputValue, setInputValue] = useState(value || '')

  // 格式化数字（整数取整，有小数点保留小数点后2位四舍五入）
  const formatNumber = (val) => {
    if (!val || val === '') return ''
    const num = parseFloat(val.replace(/,/g, ''))
    if (isNaN(num)) return val
    const rounded = Math.round(num * 100) / 100
    if (Number.isInteger(rounded)) {
      return rounded.toLocaleString('en-US')
    }
    return rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // 处理值变化
  const handleChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
  }

  // 处理失焦，格式化数字
  const handleBlur = () => {
    if (type === 'number') {
      const formattedValue = formatNumber(inputValue)
      setInputValue(formattedValue)
      onChange(formattedValue)
    }
  }

  // 外部value变化时更新inputValue
  React.useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || '')
    }
  }, [value])

  if (type === 'textarea') {
    return (
      <textarea
        value={inputValue || ''}
        onChange={handleChange}
        className={`w-full px-3 py-2 border rounded focus:outline-none transition-colors text-sm resize-none ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
        placeholder={placeholder}
        style={{ color: inputValue ? '#1f2937' : '#9ca3af' }}
        rows={rows || 2}
        {...props}
      />
    )
  }

  return (
    <input
      type={type}
      value={inputValue || ''}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`w-full px-3 py-2 border rounded focus:outline-none transition-colors text-sm ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
      placeholder={placeholder}
      style={{ color: inputValue ? '#1f2937' : '#9ca3af' }}
      {...props}
    />
  )
}

export default CustomInput
