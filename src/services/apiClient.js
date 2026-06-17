/**
 * 统一的API客户端
 * 用于前端与后端API通信
 */

class ApiClient {
  constructor() {
    this.baseURL = window.location.origin
  }

  async request(url, options = {}) {
    const token = localStorage.getItem('auth_token')
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
      },
      ...options
    }

    // 处理请求体
    if (options.body) {
      config.body = JSON.stringify(options.body)
    }

    try {
      const response = await fetch(`${this.baseURL}${url}`, config)

      if (response.status === 401) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        window.location.href = '/login'
        throw new Error('认证已过期，请重新登录')
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return { data, status: response.status }
    } catch (error) {
      console.error('API请求失败:', error)
      throw error
    }
  }

  async get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const fullUrl = queryString ? `${url}?${queryString}` : url
    return this.request(fullUrl)
  }

  async post(url, data) {
    return this.request(url, {
      method: 'POST',
      body: data
    })
  }

  async put(url, data) {
    return this.request(url, {
      method: 'PUT',
      body: data
    })
  }

  async delete(url) {
    return this.request(url, {
      method: 'DELETE'
    })
  }
}

// 创建全局实例
export default new ApiClient()