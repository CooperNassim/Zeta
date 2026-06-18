import React, { useState, useEffect } from 'react'
import {
  Users, Plus, Edit2, Trash2, Key, History, Search, Filter,
  UserCheck, UserX, Shield, ShieldCheck, Eye, X, Check, AlertCircle
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import { useToast } from '../contexts/ToastContext'
import FilterSelect from '../components/FilterSelect'
import CustomInput from '../components/CustomInput'
import Toolbar from '../components/Toolbar'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import FormModal from '../components/FormModal'

const API_BASE_URL = ''

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
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
  { key: 'created_at', label: '创建时间', width: '180px' },
  { key: 'actions', label: '操作', width: '160px' }
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

// 模态框组件
const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-2xl ${maxWidth} w-full max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

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
  const [selectedUser, setSelectedUser] = useState(null)
  const [loginLogs, setLoginLogs] = useState([])

  // 表单状态
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'viewer',
    status: 'active'
  })
  const [resetPasswordData, setResetPasswordData] = useState({
    password: '',
    confirmPassword: ''
  })

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

    try {
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

      showToast('用户创建成功', 'success')
      setShowCreateModal(false)
      setFormData({ username: '', password: '', role: 'viewer', status: 'active' })
      fetchUsers()
    } catch (error) {
      console.error('创建用户错误:', error)
      showToast(error.message, 'error')
    }
  }

  // 更新用户
  const handleUpdateUser = async (e) => {
    e.preventDefault()

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

      showToast('用户更新成功', 'success')
      setShowEditModal(false)
      fetchUsers()
    } catch (error) {
      console.error('更新用户错误:', error)
      showToast(error.message, 'error')
    }
  }

  // 删除用户
  const handleDeleteUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${selectedIds[0]}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '删除用户失败')
      }

      showToast('用户删除成功', 'success')
      setSelectedIds([])
      fetchUsers()
    } catch (error) {
      console.error('删除用户错误:', error)
      showToast(error.message, 'error')
    }
  }

  // 重置密码
  const handleResetPassword = async (e) => {
    e.preventDefault()

    if (resetPasswordData.password !== resetPasswordData.confirmPassword) {
      showToast('两次输入的密码不一致', 'error')
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
      status: user.status
    })
    setShowEditModal(true)
  }

  // 打开重置密码模态框
  const openResetPasswordModal = (user) => {
    setSelectedUser(user)
    setResetPasswordData({ password: '', confirmPassword: '' })
    setShowResetPasswordModal(true)
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
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
            {item.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{item.username}</div>
            {item.id === currentUser?.id && (
              <div className="text-xs text-gray-500">当前用户</div>
            )}
          </div>
        </div>
      )
    }
    if (field.key === 'role') {
      const role = roleMap[item.role]
      const RoleIcon = role?.icon || Users
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${role?.color || 'bg-gray-100 text-gray-700'}`}>
          <RoleIcon className="w-3 h-3" />
          {role?.label || item.role}
        </span>
      )
    }
    if (field.key === 'status') {
      const status = statusMap[item.status]
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status?.color || 'bg-gray-100 text-gray-700'}`}>
          {status?.label || item.status}
        </span>
      )
    }
    if (field.key === 'created_at') {
      return <span className="text-sm text-gray-500">{formatDateTime(item.created_at)}</span>
    }
    if (field.key === 'actions') {
      return (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => fetchLoginLogs(item.id)}
            className="text-blue-600 hover:text-blue-900 transition-colors p-1.5 hover:bg-blue-50 rounded"
            title="查看登录记录"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={() => openResetPasswordModal(item)}
            className="text-yellow-600 hover:text-yellow-900 transition-colors p-1.5 hover:bg-yellow-50 rounded"
            title="重置密码"
          >
            <Key className="w-4 h-4" />
          </button>
        </div>
      )
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
            <div style={{ position: 'relative', width: '240px' }}>
              <CustomInput
                value={searchTerm}
                onChange={(value) => {
                  setSearchTerm(value)
                  setCurrentPage(1)
                }}
                placeholder="搜索用户名..."
              />
            </div>
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
            setFormData({ username: '', password: '', role: 'viewer', status: 'active' })
            setShowCreateModal(true)
          }}
          onEdit={openEditModal}
          onDelete={selectedIds.length === 1 ? handleDeleteUser : null}
          canEdit={selectedIds.length === 1}
          canDelete={selectedIds.length === 1}
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
        onClose={() => setShowCreateModal(false)}
        title="创建用户"
      >
        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              用户名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength="6"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              角色 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="viewer">观察者</option>
              <option value="trader">交易员</option>
              <option value="admin">管理员</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              状态 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">活跃</option>
              <option value="inactive">停用</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              创建
            </button>
          </div>
        </form>
      </Modal>

      {/* 编辑用户模态框 */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="编辑用户"
      >
        <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              用户名
            </label>
            <input
              type="text"
              value={formData.username}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              角色 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="viewer">观察者</option>
              <option value="trader">交易员</option>
              <option value="admin">管理员</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              状态 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">活跃</option>
              <option value="inactive">停用</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              保存
            </button>
          </div>
        </form>
      </Modal>

      {/* 重置密码模态框 */}
      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        title="重置密码"
      >
        <form onSubmit={handleResetPassword} className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              为 <strong>{selectedUser?.username}</strong> 设置新密码
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              新密码 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={resetPasswordData.password}
              onChange={(e) => setResetPasswordData({ ...resetPasswordData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength="6"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              确认密码 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={resetPasswordData.confirmPassword}
              onChange={(e) => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength="6"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowResetPasswordModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              重置密码
            </button>
          </div>
        </form>
      </Modal>

      {/* 登录日志模态框 */}
      <Modal
        isOpen={showLoginLogsModal}
        onClose={() => setShowLoginLogsModal(false)}
        title="登录记录"
        maxWidth="max-w-4xl"
      >
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              用户 <strong>{selectedUser?.username}</strong> 的登录记录（最近 100 条）
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
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
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
        </div>
      </Modal>
    </div>
  )
}

export default AccountManagement
