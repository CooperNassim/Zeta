import React from 'react'
import { Upload } from 'lucide-react'

/**
 * 头像上传组件
 * @param {string} preview - 头像预览 URL
 * @param {function} onUpload - 上传回调函数
 * @param {boolean} uploading - 是否正在上传
 * @param {string} size - 尺寸: sm, md, lg
 */
const AvatarUpload = ({ preview, onUpload, uploading = false, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center`}>
          {preview ? (
            <img
              src={preview}
              alt="头像预览"
              className="w-full h-full object-cover"
            />
          ) : (
            <Upload className="w-8 h-8 text-gray-400" />
          )}
        </div>

        {/* 上传按钮 */}
        <label
          className={`absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${uploading ? 'pointer-events-none' : ''}`}
        >
          <Upload className="w-6 h-6 text-white" />
          <input
            type="file"
            accept="image/*"
            onChange={onUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>

        {/* 上传中状态 */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 text-center">
        {preview ? '点击更换头像' : '点击上传头像'}
        <br />
        支持 JPG、PNG、GIF、WEBP，最大 5MB
      </div>
    </div>
  )
}

export default AvatarUpload
