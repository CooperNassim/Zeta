import React from 'react'

const ErrorMessage = ({ message = '不能为空', className = '', showIcon = false, icon: Icon }) => {
  return (
    <div className={`flex items-center gap-2 mt-1 ${showIcon ? 'text-red-600 text-sm' : 'text-red-500 text-xs'} ${className}`}>
      {showIcon && Icon && <Icon className="w-4 h-4" />}
      <p>{message}</p>
    </div>
  )
}

export default ErrorMessage
