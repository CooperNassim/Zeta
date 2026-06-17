const API_BASE_URL = '';

/**
 * 认证相关 API 客户端
 */
const authClient = {
  /**
   * 登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<Object>} 包含 token 和用户信息
   */
  async login(username, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '登录失败');
    }

    return response.json();
  },

  /**
   * 登出
   * @param {string} token - JWT token
   * @returns {Promise<void>}
   */
  async logout(token) {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '登出失败');
    }
  },

  /**
   * 获取当前用户信息
   * @param {string} token - JWT token
   * @returns {Promise<Object>} 用户信息
   */
  async getCurrentUser(token) {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('获取用户信息失败');
    }

    return response.json();
  }
};

export default authClient;
