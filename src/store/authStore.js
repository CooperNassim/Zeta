import { create } from 'zustand';
import authClient from '../services/authClient';

const useAuthStore = create((set, get) => ({
  // 状态
  token: localStorage.getItem('auth_token') || null,
  user: JSON.parse(localStorage.getItem('auth_user') || 'null'),
  isAuthenticated: !!localStorage.getItem('auth_token'),
  isLoading: false,
  error: null,

  // 登录
  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await authClient.login(username, password);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // 登出
  logout: async () => {
    const { token } = get();
    try {
      if (token) {
        await authClient.logout(token);
      }
    } catch (error) {
      console.error('登出错误:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      set({ token: null, user: null, isAuthenticated: false });
    }
  },

  // 刷新用户信息
  refreshUser: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const user = await authClient.getCurrentUser(token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      set({ user });
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      // token 可能已过期，清除认证状态
      if (error.message.includes('403') || error.message.includes('无效')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        set({ token: null, user: null, isAuthenticated: false });
      }
    }
  },

  // 清除错误
  clearError: () => set({ error: null }),

  // 检查是否有权限
  hasPermission: (requiredRole) => {
    const { user } = get();
    if (!user) return false;

    const roleHierarchy = { admin: 3, trader: 2, viewer: 1 };
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }
}));

export default useAuthStore;
