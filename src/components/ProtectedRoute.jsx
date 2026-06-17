import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, hasPermission } = useAuthStore()

  // 未登录，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 需要特定角色但用户权限不足
  if (requiredRole && !hasPermission(requiredRole)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
