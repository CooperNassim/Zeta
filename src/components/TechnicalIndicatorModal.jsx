import React, { useState, useRef, useEffect } from 'react'
import Modal from './Modal'
import ErrorMessage from './ErrorMessage'
import { X, Plus, Edit2, Trash2, Play, AlertCircle } from 'lucide-react'

const TechnicalIndicatorModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  mode = 'add'
}) => {
  const [formData, setFormData] = useState({
    previewImage: initialData?.icon || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    code: initialData?.code || '',
    codeLanguage: initialData?.codeLanguage || '同花顺',
    mathModel: initialData?.mathModel || '',
    tags: initialData?.tags || []
  })

  const [showAddTag, setShowAddTag] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [editingTag, setEditingTag] = useState(null)
  const [editingTagValue, setEditingTagValue] = useState('')
  const [codeError, setCodeError] = useState('')
  const [imagePreview, setImagePreview] = useState(initialData?.icon || '')
  const fileInputRef = useRef(null)

  // 标签颜色生成函数
  const getTagColor = (tag) => {
    const colors = [
      { bg: '#fee2e2', text: '#991b1b' },  // 红色
      { bg: '#fef3c7', text: '#92400e' },  // 黄色
      { bg: '#d1fae5', text: '#065f46' },  // 绿色
      { bg: '#dbeafe', text: '#1e40af' },  // 蓝色
      { bg: '#e0e7ff', text: '#3730a3' },  // 靛青
      { bg: '#f3e8ff', text: '#6b21a8' },  // 紫色
      { bg: '#fce7f3', text: '#9d174d' },  // 粉色
      { bg: '#e0f2fe', text: '#075985' },  // 天蓝
      { bg: '#dcfce7', text: '#166534' },  // 浅绿
      { bg: '#ffedd5', text: '#9a3412' },  // 橙色
    ]
    // 根据标签名生成一致的索引
    let hash = 0
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  // 处理图片上传
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // 限制图片大小为 2MB
      if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过 2MB')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        // 使用 canvas 压缩图片
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const maxSize = 300 // 最大尺寸
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height
              height = maxSize
            }
          }

          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)

          // 压缩为 JPEG，质量 0.7
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7)
          setFormData({ ...formData, previewImage: compressedDataUrl })
          setImagePreview(compressedDataUrl)
        }
        img.src = reader.result
      }
      reader.readAsDataURL(file)
    }
  }

  // 移除图片
  const handleRemoveImage = () => {
    setFormData({ ...formData, previewImage: '' })
    setImagePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 添加标签
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      })
      setNewTag('')
      setShowAddTag(false)
    }
  }

  // 删除标签
  const handleDeleteTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    })
  }

  // 开始编辑标签
  const handleEditTagStart = (tag) => {
    setEditingTag(tag)
    setEditingTagValue(tag)
  }

  // 保存编辑的标签
  const handleEditTagSave = () => {
    if (editingTagValue.trim() && editingTagValue !== editingTag) {
      setFormData({
        ...formData,
        tags: formData.tags.map(t => t === editingTag ? editingTagValue.trim() : t)
      })
    }
    setEditingTag(null)
    setEditingTagValue('')
  }

  // 取消编辑标签
  const handleEditTagCancel = () => {
    setEditingTag(null)
    setEditingTagValue('')
  }

  // 代码测试
  const handleTestCode = () => {
    try {
      // 简单的语法检查
      if (!formData.code.trim()) {
        setCodeError('代码不能为空')
        return
      }

      // 模拟不同语言的语法检查
      const patterns = {
        '同花顺': /^[A-Z_:][A-Z0-9_:\s\(\),=\+\-\*\/\[\]]+$/i,
        '通达信': /^[A-Z_:][A-Z0-9_:\s\(\),=\+\-\*\/\[\]]+$/i,
        'C语言': /^[a-zA-Z_][a-zA-Z0-9_\s\(\),=\+\-\*\/\{\}\[\];]*$/
      }

      if (patterns[formData.codeLanguage] && !patterns[formData.codeLanguage].test(formData.code)) {
        setCodeError(`代码语法错误，请检查${formData.codeLanguage}语法`)
        return
      }

      setCodeError('')
      // 这里可以调用实际的编译/测试服务
      console.log('代码测试通过')
    } catch (error) {
      setCodeError('代码测试失败: ' + error.message)
    }
  }

  // 保存
  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('请输入指标名称')
      return
    }
    if (!formData.description.trim()) {
      alert('请输入描述')
      return
    }

    onSubmit({
      name: formData.name,
      description: formData.description,
      icon: formData.previewImage,
      code: formData.code,
      codeLanguage: formData.codeLanguage,
      mathModel: formData.mathModel,
      tags: formData.tags
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? '新增技术指标' : '编辑技术指标'}
      width="max-w-4xl"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#0F1419' }}
          >
            保存
          </button>
        </>
      }
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* 第一行：预览图片 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            预览图片
          </label>
          <div className="flex items-start gap-4">
            <div className="relative">
              {imagePreview ? (
                <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="预览"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">暂无图片</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
                id="imageUpload"
              />
              <label
                htmlFor="imageUpload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                上传图片
              </label>
              <p className="text-xs text-gray-500 mt-2">
                支持上传 PNG、JPG、GIF 格式的图片，建议尺寸 256x256px
              </p>
            </div>
          </div>
        </div>

        {/* 第二行：指标名称和描述 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              指标名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入指标名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="请输入指标描述"
            />
          </div>
        </div>

        {/* 第三行：代码编译 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              代码编译
            </label>
            <div className="flex items-center gap-2">
              <select
                value={formData.codeLanguage}
                onChange={(e) => setFormData({ ...formData, codeLanguage: e.target.value })}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="同花顺">同花顺</option>
                <option value="通达信">通达信</option>
                <option value="C语言">C语言</option>
              </select>
              <button
                onClick={handleTestCode}
                className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
              >
                <Play className="w-3 h-3" />
                测试
              </button>
            </div>
          </div>
          <textarea
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
            rows={8}
            placeholder={`请输入${formData.codeLanguage}代码`}
            style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
          />
          {codeError && (
            <ErrorMessage
              message={codeError}
              showIcon={true}
              icon={AlertCircle}
            />
          )}
          <p className="text-xs text-gray-500 mt-1">
            支持同花顺、通达信、C语言等多种语言，后续股票图标指标可直接调用此模块计算
          </p>
        </div>

        {/* 第四行：数学模型 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            数学模型
          </label>
          <textarea
            value={formData.mathModel}
            onChange={(e) => setFormData({ ...formData, mathModel: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
            placeholder="请输入数学模型，支持上下标、除数公式等"
          />
          <p className="text-xs text-gray-500 mt-1">
            支持常规的数学符号写入，如上下标、除数公式等
          </p>
        </div>

        {/* 第五行：标签 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            标签
          </label>
          <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg min-h-[80px]">
            {formData.tags.map((tag, index) => {
              const color = getTagColor(tag)
              return (
                <div
                  key={index}
                  className="flex items-center gap-1"
                  style={{
                    backgroundColor: color.bg,
                    color: color.text
                  }}
                >
                  {editingTag === tag ? (
                    <input
                      type="text"
                      value={editingTagValue}
                      onChange={(e) => setEditingTagValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleEditTagSave()}
                      onBlur={handleEditTagSave}
                      className="w-20 px-1 py-0.5 text-xs bg-white rounded border-0 focus:ring-1 focus:ring-blue-500"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium">{tag}</span>
                  )}
                  {editingTag !== tag && (
                    <>
                      <button
                        onClick={() => handleEditTagStart(tag)}
                        className="p-0.5 hover:opacity-70"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag)}
                        className="p-0.5 hover:opacity-70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              )
            })}
            {showAddTag ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="输入标签"
                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleAddTag}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  确认
                </button>
                <button
                  onClick={() => {
                    setShowAddTag(false)
                    setNewTag('')
                  }}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddTag(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 border border-dashed border-gray-400 rounded hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                <Plus className="w-3 h-3" />
                添加标签
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            支持选择已有的标签和新增、删除、编辑标签，不同的标签随机颜色
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default TechnicalIndicatorModal
