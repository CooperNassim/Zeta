/**
 * 密码工具函数
 * 提供密码加密和验证功能
 */

const bcrypt = require('bcrypt');

// Salt rounds 设置为 10
const SALT_ROUNDS = 10;

/**
 * 加密密码
 * @param {string} password - 明文密码
 * @returns {Promise<string>} 加密后的密码哈希
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @param {string} hash - 密码哈希
 * @returns {Promise<boolean>} 密码是否匹配
 */
const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

module.exports = {
  hashPassword,
  verifyPassword
};
