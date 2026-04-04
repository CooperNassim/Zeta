const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// POST /api/admin/reset-transactions - 重置交易数据状态（开发工具）
router.post('/reset-transactions', async (req, res) => {
  try {
    console.log('开始重置交易数据状态...');
    
    // 将所有交易记录的deleted标记为false，deleted_at设为null
    const result = await pool.query(`
      UPDATE transactions 
      SET deleted = false, deleted_at = NULL 
    `);
    
    console.log(`成功更新了 ${result.rowCount} 条交易记录`);
    
    res.json({ 
      success: true, 
      message: `成功重置了 ${result.rowCount} 条交易记录`,
      resetCount: result.rowCount
    });
  } catch (error) {
    console.error('重置交易数据状态失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '重置失败',
      error: error.message 
    });
  }
});

// POST /api/admin/check-transactions - 检查交易数据状态
router.post('/check-transactions', async (req, res) => {
  try {
    console.log('检查交易数据状态...');
    
    // 查询所有交易记录的状态
    const allResult = await pool.query(`SELECT COUNT(*) as total FROM transactions`);
    const deletedResult = await pool.query(`SELECT COUNT(*) as deleted_count FROM transactions WHERE deleted = true`);
    const activeResult = await pool.query(`SELECT COUNT(*) as active_count FROM transactions WHERE deleted = false`);
    
    const details = await pool.query(`
      SELECT id, deleted, deleted_at, transaction_type, amount, account 
      FROM transactions 
      ORDER BY created_at DESC 
      LIMIT 20
    `);
    
    res.json({ 
      success: true,
      data: {
        total: parseInt(allResult.rows[0].total),
        deleted: parseInt(deletedResult.rows[0].deleted_count),
        active: parseInt(activeResult.rows[0].active_count),
        details: details.rows
      }
    });
  } catch (error) {
    console.error('检查交易数据状态失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '检查失败',
      error: error.message 
    });
  }
});

module.exports = router;