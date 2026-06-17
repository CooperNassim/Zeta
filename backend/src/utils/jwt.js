/**
 * JWT 工具函数
 * 提供 token 生成和验证功能
 */

const jwt = require('jsonwebtoken');

// JWT 密钥：生产环境必须通过环境变量设置，否则拒绝启动
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production') {
  console.error('❌ 错误: 未设置 JWT_SECRET 环境变量！');
  console.error('   请在 backend/.env 中添加: JWT_SECRET=你的随机密钥');
  console.error('   生成随机密钥: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

// Token 有效期：24 小时
const TOKEN_EXPIRES_IN = '24h';

/**
 * 生成 JWT token
 * @param {Object} payload - 要编码到 token 中的数据
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN, algorithm: 'HS256' });
};

/**
 * 验证并解码 JWT token
 * @param {string} token - JWT token 字符串
 * @returns {Object} 解码后的 payload 数据
 * @throws {Error} token 无效或已过期时抛出错误
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
};

module.exports = {
  generateToken,
  verifyToken
};
