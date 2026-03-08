import React, { useState } from 'react'
import ConfirmModal from '../components/ConfirmModal'
import TechnicalIndicatorModal from '../components/TechnicalIndicatorModal'
import Toolbar from '../components/Toolbar'
import EmptyState from '../components/EmptyState'
import { useToast } from '../contexts/ToastContext'
import useStore from '../store/useStore'

const TechnicalIndicators = () => {
  const showToast = useToast()
  const technicalIndicators = useStore(state => state.technicalIndicators)
  const addTechnicalIndicator = useStore(state => state.addTechnicalIndicator)
  const updateTechnicalIndicator = useStore(state => state.updateTechnicalIndicator)
  const deleteTechnicalIndicator = useStore(state => state.deleteTechnicalIndicator)

  const [selectedIds, setSelectedIds] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingIndicator, setEditingIndicator] = useState(null)
  const [filterName, setFilterName] = useState('')
  const [filterTag, setFilterTag] = useState('全部')

  // 获取所有标签
  const allTags = ['全部', ...new Set(technicalIndicators.flatMap(i => i.tags || []))]

  // 筛选数据
  const filteredIndicators = technicalIndicators.filter(indicator => {
    // 过滤已删除的数据
    if (indicator.deleted) return false

    const matchName = !filterName || indicator.name.toLowerCase().includes(filterName.toLowerCase())
    const matchTag = filterTag === '全部' || (indicator.tags && indicator.tags.includes(filterTag))
    return matchName && matchTag
  })

  const handleAdd = () => {
    setShowAddModal(true)
  }

  const handleEdit = () => {
    if (selectedIds.length !== 1) {
      showToast('请选择一个指标进行编辑')
      return
    }
    const indicator = technicalIndicators.find(i => i.id === selectedIds[0])
    if (indicator) {
      setEditingIndicator(indicator)
      setShowEditModal(true)
    }
  }

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      showToast('请选择要删除的指标')
      return
    }
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    selectedIds.forEach(id => {
      deleteTechnicalIndicator(id)
    })
    setSelectedIds([])
    setShowDeleteModal(false)
    showToast('删除成功')
  }

  const handleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSave = (formData) => {
    addTechnicalIndicator({
      name: formData.name,
      description: formData.description,
      icon: formData.previewImage,
      code: formData.code,
      codeLanguage: formData.codeLanguage,
      mathModel: formData.mathModel,
      tags: formData.tags || []
    })
    setShowAddModal(false)
    showToast('保存成功')
  }

  const handleUpdate = (formData) => {
    if (editingIndicator) {
      updateTechnicalIndicator(editingIndicator.id, {
        name: formData.name,
        description: formData.description,
        icon: formData.previewImage,
        code: formData.code,
        codeLanguage: formData.codeLanguage,
        mathModel: formData.mathModel,
        tags: formData.tags || []
      })
      setShowEditModal(false)
      setEditingIndicator(null)
      setSelectedIds([])
      showToast('更新成功')
    }
  }

  const formFields = [
    { key: 'name', label: '指标名称', type: 'text', required: true },
    { key: 'description', label: '指标描述', type: 'textarea', required: true },
    { key: 'icon', label: '图标URL', type: 'text', required: true, placeholder: '请输入图标URL' },
    { key: 'tags', label: '标签', type: 'select', options: allTags.filter(t => t !== '全部').map(t => ({ value: t, label: t })), multiple: true, placeholder: '请选择标签' }
  ]

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '10px', paddingRight: '10px' }}>
        {/* 筛选条件 */}
        <div style={{ flexShrink: 0, marginTop: '10px' }}>
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="搜索指标名称"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                width: '240px'
              }}
            />
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                width: '180px',
                cursor: 'pointer',
                color: filterTag === '全部' ? '#9ca3af' : '#1f2937',
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
                appearance: 'none'
              }}
            >
              {allTags.map(tag => (
                <option key={tag} value={tag} style={{ color: '#1f2937' }}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 工具栏 */}
        <Toolbar
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canEdit={selectedIds.length === 1}
          canDelete={selectedIds.length > 0}
          totalCount={filteredIndicators.length}
        />

        {/* 指标列表 */}
        <div style={{ flex: 1, overflow: 'auto', marginTop: '10px' }}>
          {filteredIndicators.length === 0 ? (
            <EmptyState message="暂无技术指标数据" />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '20px',
              paddingBottom: '20px'
            }}>
              {filteredIndicators.map((indicator) => (
                <div
                  key={indicator.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelect(indicator.id)
                  }}
                  style={{
                    background: '#ffffff',
                    border: selectedIds.includes(indicator.id) ? '1px solid #0F1419' : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    height: '280px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* 图标区域 */}
                  <div style={{
                    height: '160px',
                    background: 'linear-gradient(135deg, #0F1419 0%, #1a1f2e 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}>
                    <img
                      src={indicator.icon}
                      alt={indicator.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.innerHTML = `<div style="font-size: 48px; font-weight: bold; color: white;">${indicator.name.substring(0, 2)}</div>`
                      }}
                    />
                  </div>

                  {/* 内容区域 */}
                  <div style={{
                    padding: '16px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#111827',
                      marginBottom: '8px',
                      margin: '0'
                    }}>
                      {indicator.name}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      lineHeight: '1.5',
                      marginBottom: '12px',
                      flex: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {indicator.description}
                    </p>
                    {/* 标签 */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(indicator.tags || []).map((tag, index) => (
                        <span
                          key={index}
                          style={{
                            padding: '4px 10px',
                            background: '#f3f4f6',
                            color: '#4b5563',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 添加弹窗 */}
        <TechnicalIndicatorModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleSave}
          mode="add"
        />

        {/* 编辑弹窗 */}
        <TechnicalIndicatorModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingIndicator(null)
          }}
          onSubmit={handleUpdate}
          initialData={editingIndicator}
          mode="edit"
        />

        {/* 删除确认弹窗 */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="删除"
          message={`确认删除${selectedIds.length}条数据吗？`}
          confirmText="删除"
        />
      </div>
    </div>
  )
}

export default TechnicalIndicators
