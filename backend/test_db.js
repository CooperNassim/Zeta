require('dotenv').config();
const { pool } = require('./src/config/database');

pool.query('SELECT NOW()')
  .then(r => {
    console.log('连接成功:', r.rows[0].now);
    pool.end();
  })
  .catch(e => console.log('连接失败:', e.message));
