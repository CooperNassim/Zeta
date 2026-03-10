const express = require('express');
const router = require('./src/routes/api');

console.log('已注册的路由:');
router.stack?.forEach((layer) => {
  console.log(`  路径: ${layer.regexp || layer.route?.path}`);
  console.log(`  方法:`, layer.route?.methods || 'N/A');
  console.log('---');
});
