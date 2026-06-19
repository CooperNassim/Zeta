import React, { useState, useEffect } from 'react'
import {
  Users, Plus, Edit2, Trash2, Search, Filter,
  UserCheck, UserX, Shield, ShieldCheck, Eye, X, Check, AlertCircle, Upload
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import { useToast } from '../contexts/ToastContext'
import FilterSelect from '../components/FilterSelect'
import CustomInput from '../components/CustomInput'
import SearchInput from '../components/SearchInput'
import Toolbar from '../components/Toolbar'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import AvatarUpload from '../components/AvatarUpload'
import CustomSelect from '../components/CustomSelect'
import ConfirmModal from '../components/ConfirmModal'
import ErrorMessage from '../components/ErrorMessage'

const API_BASE_URL = ''

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

// 角色映射
const roleMap = {
  admin: { label: '管理员', color: 'bg-purple-100 text-purple-700', icon: ShieldCheck },
  trader: { label: '交易员', color: 'bg-blue-100 text-blue-700', icon: UserCheck },
  viewer: { label: '观察者', color: 'bg-gray-100 text-gray-700', icon: Eye }
}

// 状态映射
const statusMap = {
  active: { label: '活跃', color: 'bg-green-100 text-green-700' },
  inactive: { label: '停用', color: 'bg-red-100 text-red-700' }
}

// 表格字段定义
const TABLE_FIELDS = [
  { key: 'username', label: '用户名', width: '200px' },
  { key: 'role', label: '角色', width: '120px' },
  { key: 'status', label: '状态', width: '100px' },
  { key: 'last_login_at', label: '最近登录时间', width: '180px' },
  { key: 'created_at', label: '创建时间', width: '180px' }
]

// 角色选项
const roleOptions = [
  { value: 'admin', label: '管理员' },
  { value: 'trader', label: '交易员' },
  { value: 'viewer', label: '观察者' }
]

// 状态选项
const statusOptions = [
  { value: 'active', label: '活跃' },
  { value: 'inactive', label: '停用' }
]

const AccountManagement = () => {
  const { user: currentUser, token } = useAuthStore()
  const { showToast } = useToast()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])
  const pageSize = 20

  // 模态框状态
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [showLoginLogsModal, setShowLoginLogsModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [loginLogs, setLoginLogs] = useState([])

  // 表单状态
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'viewer',
    status: 'active',
    avatar: null
  })
  const [formErrors, setFormErrors] = useState({})
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [resetPasswordData, setResetPasswordData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [resetPasswordErrors, setResetPasswordErrors] = useState({})

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          window.location.href = '/login'
          return
        }
        throw new Error('获取用户列表失败')
      }

      const data = await response.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('获取用户列表错误:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // 创建用户
  const handleCreateUser = async (e) => {
    e.preventDefault()

    // 表单验证
    const errors = {}
    if (!formData.username) errors.username = '不能为空'
    if (!formData.password) errors.password = '不能为空'
    if (!formData.role) errors.role = '不能为空'
    if (!formData.status) errors.status = '不能为空'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      // 先创建用户
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '创建用户失败')
      }

      const newUser = await response.json()

      // 如果有头像文件，上传头像
      if (formData.avatarFile) {
        const avatarFormData = new FormData()
        avatarFormData.append('avatar', formData.avatarFile)

        const avatarResponse = await fetch(`${API_BASE_URL}/api/users/${newUser.id}/avatar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: avatarFormData
        })

        if (!avatarResponse.ok) {
          const error = await avatarResponse.json()
          throw new Error(error.error || '上传头像失败')
        }
      }

      showToast('创建成功', 'success')
      setShowCreateModal(false)
      setFormData({ username: '', password: '', role: 'viewer', status: 'active', avatar: null, avatarFile: null })
      setAvatarPreview(null)
      fetchUsers()
    } catch (error) {
      console.error('创建用户错误:', error)
      showToast(error.message, 'error')
    }
  }

  // 更新用户
  const handleUpdateUser = async (e) => {
    e.preventDefault()

    // 表单验证
    const errors = {}
    if (!formData.role) errors.role = '不能为空'
    if (!formData.status) errors.status = '不能为空'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: formData.role,
          status: formData.status
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '更新用户失败')
      }

      // 如果有头像文件，上传头像
      if (formData.avatarFile) {
        const avatarFormData = new FormData()
        avatarFormData.append('avatar', formData.avatarFile)

        const avatarResponse = await fetch(`${API_BASE_URL}/api/users/${selectedUser.id}/avatar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: avatarFormData
        })

        if (!avatarResponse.ok) {
          const error = await avatarResponse.json()
          throw new Error(error.error || '上传头像失败')
        }
      }

      showToast('更新成功', 'success')
      setShowEditModal(false)
      fetchUsers()
    } catch (error) {
      console.error('更新用户错误:', error)
      showToast(error.message, 'error')
    }
  }

  // 删除用户
  const handleDeleteUser = () => {
    if (selectedIds.length === 0) return
    setShowDeleteModal(true)
  }

  const confirmDeleteUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/batch-delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedIds })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '删除用户失败')
      }

      showToast('删除成功', 'success')
      setSelectedIds([])
      setShowDeleteModal(false)
      fetchUsers()
    } catch (error) {
      console.error('删除用户错误:', error)
      showToast(error.message, 'error')
    }
  }

  // 重置密码
  const handleResetPassword = async (e) => {
    e.preventDefault()

    // 表单验证
    const errors = {}
    if (!resetPasswordData.password) errors.password = '不能为空'
    if (!resetPasswordData.confirmPassword) errors.confirmPassword = '不能为空'
    else if (resetPasswordData.password !== resetPasswordData.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致'
    }

    if (Object.keys(errors).length > 0) {
      setResetPasswordErrors(errors)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${selectedUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: resetPasswordData.password })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '重置密码失败')
      }

      showToast('密码重置成功', 'success')
      setShowResetPasswordModal(false)
      setResetPasswordData({ password: '', confirmPassword: '' })
      setResetPasswordErrors({})
    } catch (error) {
      console.error('重置密码错误:', error)
      showToast(error.message, 'error')
    }
  }

  // 获取登录日志
  const fetchLoginLogs = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/login-logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('获取登录日志失败')
      }

      const data = await response.json()
      setLoginLogs(data)
      setShowLoginLogsModal(true)
    } catch (error) {
      console.error('获取登录日志错误:', error)
      showToast('获取登录日志失败', 'error')
    }
  }

  // 打开编辑模态框
  const openEditModal = () => {
    if (selectedIds.length !== 1) return
    const user = users.find(u => u.id === selectedIds[0])
    if (!user) return
    setSelectedUser(user)
    setFormData({
      username: user.username,
      role: user.role,
      status: user.status,
      avatar: user.avatar || null
    })
    setAvatarPreview(user.avatar ? `${API_BASE_URL}/${user.avatar}` : null)
    setFormErrors({})
    setShowEditModal(true)
  }

  // 处理头像上传
  const handleAvatarUpload = async (e, userId = null) => {
    const file = e.target.files[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      showToast('请选择图片文件', 'error')
      return
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('图片大小不能超过 5MB', 'error')
      return
    }

    // 预览
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result)
    }
    reader.readAsDataURL(file)

    // 暂存文件对象，点击保存时再上传
    setFormData(prev => ({ ...prev, avatarFile: file }))
  }

  // 打开重置密码模态框
  const openResetPasswordModal = (user) => {
    setSelectedUser(user)
    setResetPasswordData({ password: '', confirmPassword: '' })
    setResetPasswordErrors({})
    setShowResetPasswordModal(true)
  }

  // 工具栏重置密码
  const handleResetPasswordFromToolbar = () => {
    if (selectedIds.length !== 1) return
    const user = users.find(u => u.id === selectedIds[0])
    if (user) openResetPasswordModal(user)
  }

  // 过滤用户列表
  const filteredUsers = users.filter(user => {
    const matchSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = !roleFilter || user.role === roleFilter
    const matchStatus = !statusFilter || user.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  // 分页
  const totalPages = Math.ceil(filteredUsers.length / pageSize)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // 全选/单选
  const handleSelectAll = (ids) => setSelectedIds(ids)
  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => prev.includes(id) ? prev : [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id))
    }
  }

  // 自定义单元格渲染
  const renderCell = (field, item) => {
    if (field.key === 'username') {
      return (
        <div className="flex items-center gap-3">
          {item.avatar ? (
            <img
              src={`/${item.avatar}`}
              alt={item.username}
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
              {item.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col" style={{ gap: '0px' }}>
            <div className="text-sm text-gray-700">{item.username}</div>
            {item.id === currentUser?.id && (
              <div style={{ fontSize: '12px' }} className="text-gray-500">当前用户</div>
            )}
          </div>
        </div>
      )
    }
    if (field.key === 'role') {
      const role = roleMap[item.role]
      return (
        <span className="text-sm text-gray-700">
          {role?.label || item.role}
        </span>
      )
    }
    if (field.key === 'status') {
      const status = statusMap[item.status]
      return (
        <span className="text-sm text-gray-700">
          {status?.label || item.status}
        </span>
      )
    }
    if (field.key === 'last_login_at') {
      return (
        <button
          onClick={() => fetchLoginLogs(item.id)}
          className="text-blue-600 hover:text-blue-900 transition-colors text-sm hover:underline"
        >
          {item.last_login_at ? formatDateTime(item.last_login_at) : '-'}
        </button>
      )
    }
    if (field.key === 'created_at') {
      return <span className="text-sm text-gray-700">{formatDateTime(item.created_at)}</span>
    }
    return item[field.key]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '0px', paddingRight: '10px', position: 'relative' }}>
        {/* 筛选条件 */}
        <div style={{ flexShrink: 0, marginTop: '10px' }}>
          <div className="flex items-center" style={{ gap: '10px' }}>
            <SearchInput
              value={searchTerm}
              onChange={(value) => {
                setSearchTerm(value)
                setCurrentPage(1)
              }}
              placeholder="用户名"
            />
            <div style={{ position: 'relative', width: '160px' }}>
              <FilterSelect
                value={roleFilter}
                onChange={(value) => {
                  setRoleFilter(value)
                  setCurrentPage(1)
                }}
                options={roleOptions}
                placeholder="所有角色"
              />
            </div>
            <div style={{ position: 'relative', width: '160px' }}>
              <FilterSelect
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value)
                  setCurrentPage(1)
                }}
                options={statusOptions}
                placeholder="所有状态"
              />
            </div>
          </div>
        </div>

        {/* 工具栏 */}
        <Toolbar
          onAdd={() => {
            setFormData({ username: '', password: '', role: 'viewer', status: 'active', avatar: null, avatarFile: null })
            setAvatarPreview(null)
            setShowCreateModal(true)
          }}
          onEdit={openEditModal}
          onDelete={handleDeleteUser}
          onResetPassword={handleResetPasswordFromToolbar}
          canEdit={selectedIds.length === 1}
          canDelete={selectedIds.length > 0}
          canResetPassword={selectedIds.length === 1}
          totalCount={filteredUsers.length}
          hideImport={true}
          hideDelete={false}
          editLabel="编辑"
        />

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative', paddingBottom: '50px', zIndex: '1', background: 'rgb(249, 250, 251)' }}>
          <div className="overflow-y-auto overflow-x-auto" style={{ flex: 1, minHeight: 0, position: 'relative', zIndex: '1' }}>
            <DataTable
              fields={TABLE_FIELDS}
              data={paginatedUsers}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectOne={handleSelectOne}
              renderCell={renderCell}
              emptyStateProps={{
                Component: EmptyState,
                props: { message: '暂无数据' }
              }}
            />
          </div>
        </div>

        {/* 分页器 */}
        <div style={{ position: 'absolute', right: '0', bottom: '0', height: '50px', zIndex: '10', width: '100%' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page)
              setSelectedIds([])
            }}
            selectedCount={selectedIds.length}
            totalCount={filteredUsers.length}
          />
        </div>
      </div>

      {/* 创建用户模态框 */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setFormErrors({})
        }}
        title="新增账号"
        width="max-w-2xl"
        footer={
          <>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              form="createForm"
              className="px-4 py-2 rounded text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#0F1419' }}
            >
              创建
            </button>
          </>
        }
      >
        <form id="createForm" onSubmit={handleCreateUser} className="space-y-4">
          <div className="flex justify-center mb-2">
            <AvatarUpload
              preview={avatarPreview}
              onUpload={handleAvatarUpload}
              uploading={false}
              size="md"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                <span className="text-red-500">*</span> 用户名
              </label>
              <CustomInput
                value={formData.username}
                onChange={(value) => {
                  setFormData({ ...formData, username: value })
                  if (value && formErrors.username) setFormErrors(prev => ({ ...prev, username: false }))
                }}
                placeholder="请输入"
                error={!!formErrors.username}
              />
              {formErrors.username && <ErrorMessage message={formErrors.username} />}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                <span className="text-red-500">*</span> 密码
              </label>
              <CustomInput
                type="password"
                value={formData.password}
                onChange={(value) => {
                  setFormData({ ...formData, password: value })
                  if (value && formErrors.password) setFormErrors(prev => ({ ...prev, password: false }))
                }}
                placeholder="请输入"
                error={!!formErrors.password}
              />
              {formErrors.password && <ErrorMessage message={formErrors.password} />}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                <span className="text-red-500">*</span> 角色
              </label>
              <CustomSelect
                value={formData.role}
                onChange={(value) => {
                  setFormData({ ...formData, role: value })
                  if (value && formErrors.role) setFormErrors(prev => ({ ...prev, role: false }))
                }}
                options={roleOptions}
                placeholder="请选择"
                error={!!formErrors.role}
              />
              {formErrors.role && <ErrorMessage message={formErrors.role} />}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                <span className="text-red-500">*</span> 状态
              </label>
              <CustomSelect
                value={formData.status}
                onChange={(value) => {
                  setFormData({ ...formData, status: value })
                  if (value && formErrors.status) setFormErrors(prev => ({ ...prev, status: false }))
                }}
                options={statusOptions}
                placeholder="请选择"
                error={!!formErrors.status}
              />
              {formErrors.status && <ErrorMessage message={formErrors.status} />}
            </div>
          </div>
        </form>
      </Modal>

      {/* 编辑用户模态框 */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setFormErrors({})
        }}
        title="编辑账号"
        width="max-w-2xl"
        footer={
          <>
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              form="editForm"
              className="px-4 py-2 rounded text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#0F1419' }}
            >
              保存
            </button>
          </>
        }
      >
        <form id="editForm" onSubmit={handleUpdateUser} className="space-y-4">
          <div className="flex justify-center mb-2">
            <AvatarUpload
              preview={avatarPreview}
              onUpload={handleAvatarUpload}
              uploading={uploadingAvatar}
              size="md"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                用户名
              </label>
              <CustomInput
                value={formData.username}
                onChange={() => {}}
                placeholder="请输入用户名"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                <span className="text-red-500">*</span> 角色
              </label>
              <CustomSelect
                value={formData.role}
                onChange={(value) => {
                  setFormData({ ...formData, role: value })
                  if (value && formErrors.role) setFormErrors(prev => ({ ...prev, role: false }))
                }}
                options={roleOptions}
                placeholder="请选择"
                error={!!formErrors.role}
              />
              {formErrors.role && <ErrorMessage message={formErrors.role} />}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                <span className="text-red-500">*</span> 状态
              </label>
              <CustomSelect
                value={formData.status}
                onChange={(value) => {
                  setFormData({ ...formData, status: value })
                  if (value && formErrors.status) setFormErrors(prev => ({ ...prev, status: false }))
                }}
                options={statusOptions}
                placeholder="请选择"
                error={!!formErrors.status}
              />
              {formErrors.status && <ErrorMessage message={formErrors.status} />}
            </div>
          </div>
        </form>
      </Modal>

      {/* 重置密码模态框 */}
      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false)
          setResetPasswordErrors({})
        }}
        title="重置密码"
        footer={
          <>
            <button
              onClick={() => setShowResetPasswordModal(false)}
              className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              form="resetPasswordForm"
              className="px-4 py-2 rounded text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#0F1419' }}
            >
              重置密码
            </button>
          </>
        }
      >
        <form id="resetPasswordForm" onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                <span className="text-red-500">*</span> 新密码
              </label>
              <CustomInput
                type="password"
                value={resetPasswordData.password}
                onChange={(value) => {
                  setResetPasswordData({ ...resetPasswordData, password: value })
                  if (value && resetPasswordErrors.password) setResetPasswordErrors(prev => ({ ...prev, password: false }))
                }}
                placeholder="请输入"
                error={!!resetPasswordErrors.password}
              />
              {resetPasswordErrors.password && <ErrorMessage message={resetPasswordErrors.password} />}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                <span className="text-red-500">*</span> 确认密码
              </label>
              <CustomInput
                type="password"
                value={resetPasswordData.confirmPassword}
                onChange={(value) => {
                  setResetPasswordData({ ...resetPasswordData, confirmPassword: value })
                  if (value && resetPasswordErrors.confirmPassword) setResetPasswordErrors(prev => ({ ...prev, confirmPassword: false }))
                }}
                placeholder="请输入"
                error={!!resetPasswordErrors.confirmPassword}
              />
              {resetPasswordErrors.confirmPassword && <ErrorMessage message={resetPasswordErrors.confirmPassword} />}
            </div>
        </form>
      </Modal>

      {/* 登录日志模态框 */}
      <Modal
        isOpen={showLoginLogsModal}
        onClose={() => setShowLoginLogsModal(false)}
        title="登录记录"
        width="max-w-4xl"
        showFooter={false}
      >
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            最近100条登录记录
          </p>
        </div>

        {loginLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无登录记录
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    时间
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    结果
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    IP 地址
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    错误信息
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loginLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {log.action === 'login' && '登录'}
                      {log.action === 'logout' && '登出'}
                      {log.action === 'failed_login' && '登录失败'}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        log.result === 'success'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {log.result === 'success' ? '成功' : '失败'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500 font-mono">
                      {log.ip_address || '-'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {log.error_message || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* 删除确认模态框 */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteUser}
        title="删除"
        message={`确认删除${selectedIds.length}条数据吗？`}
      />
    </div>
  )
}

export default AccountManagement
