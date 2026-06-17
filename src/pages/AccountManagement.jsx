import React, { useState, useEffect } from 'react'
import {
  Users, Plus, Edit2, Trash2, Key, History, Search, Filter,
  UserCheck, UserX, Shield, ShieldCheck, Eye, X, Check, AlertCircle
} from 'lucide-react'
import useAuthStore from '../store/authStore'

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

// Toast 提示组件
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const styles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200'
  }

  return (
    <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg border ${styles[type]} shadow-lg z-50 flex items-center gap-2`}>
      {type === 'success' && <Check className="w-4 h-4" />}
      {type === 'error' && <X className="w-4 h-4" />}
      {type === 'warning' && <AlertCircle className="w-4 h-4" />}
      <span>{message}</span>
    </div>
  )
}

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

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

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

  const [toast, setToast] = useState(null)

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
          // token 过期，跳转到登录页
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
      setToast({ message: '获取用户列表失败', type: 'error' })
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

      setToast({ message: '用户创建成功', type: 'success' })
      setShowCreateModal(false)
      setFormData({ username: '', password: '', role: 'viewer', status: 'active' })
      fetchUsers()
    } catch (error) {
      console.error('创建用户错误:', error)
      setToast({ message: error.message, type: 'error' })
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

      setToast({ message: '用户更新成功', type: 'success' })
      setShowEditModal(false)
      fetchUsers()
    } catch (error) {
      console.error('更新用户错误:', error)
      setToast({ message: error.message, type: 'error' })
    }
  }

  // 删除用户
  const handleDeleteUser = async (user) => {
    if (!confirm(`确定要删除用户 "${user.username}" 吗？`)) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
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

      setToast({ message: '用户删除成功', type: 'success' })
      fetchUsers()
    } catch (error) {
      console.error('删除用户错误:', error)
      setToast({ message: error.message, type: 'error' })
    }
  }

  // 重置密码
  const handleResetPassword = async (e) => {
    e.preventDefault()

    if (resetPasswordData.password !== resetPasswordData.confirmPassword) {
      setToast({ message: '两次输入的密码不一致', type: 'error' })
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

      setToast({ message: '密码重置成功', type: 'success' })
      setShowResetPasswordModal(false)
      setResetPasswordData({ password: '', confirmPassword: '' })
    } catch (error) {
      console.error('重置密码错误:', error)
      setToast({ message: error.message, type: 'error' })
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
      setToast({ message: '获取登录日志失败', type: 'error' })
    }
  }

  // 打开编辑模态框
  const openEditModal = (user) => {
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
    const matchRole = roleFilter === 'all' || user.role === roleFilter
    const matchStatus = statusFilter === 'all' || user.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

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
    <div className="p-6 max-w-7xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-7 h-7" />
          账号管理
        </h1>
        <p className="text-gray-600 mt-1">管理系统用户账号、权限和登录记录</p>
      </div>

      {/* 工具栏 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* 搜索框 */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索用户名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 角色筛选 */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">所有角色</option>
              <option value="admin">管理员</option>
              <option value="trader">交易员</option>
              <option value="viewer">观察者</option>
            </select>
          </div>

          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">所有状态</option>
            <option value="active">活跃</option>
            <option value="inactive">停用</option>
          </select>

          {/* 创建用户按钮 */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            创建用户
          </button>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                用户名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                角色
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                创建时间
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                    ? '没有找到匹配的用户'
                    : '暂无用户数据'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const role = roleMap[user.role]
                const status = statusMap[user.status]
                const RoleIcon = role?.icon || Users

                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          {user.id === currentUser?.id && (
                            <div className="text-xs text-gray-500">当前用户</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${role?.color || 'bg-gray-100 text-gray-700'}`}>
                        <RoleIcon className="w-3 h-3" />
                        {role?.label || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status?.color || 'bg-gray-100 text-gray-700'}`}>
                        {status?.label || user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => fetchLoginLogs(user.id)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1.5 hover:bg-blue-50 rounded"
                          title="查看登录记录"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openResetPasswordModal(user)}
                          className="text-yellow-600 hover:text-yellow-900 transition-colors p-1.5 hover:bg-yellow-50 rounded"
                          title="重置密码"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-green-600 hover:text-green-900 transition-colors p-1.5 hover:bg-green-50 rounded"
                          title="编辑用户"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 hover:text-red-900 transition-colors p-1.5 hover:bg-red-50 rounded"
                            title="删除用户"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
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
