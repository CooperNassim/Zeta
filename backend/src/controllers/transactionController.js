const express = require('express');
const { findAll, findById, create, update, remove, bulkDelete, permanentDelete, restore } = require('../database/queries');

// 获取所有账单明细
const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 100, type, symbol } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (type) whereClause.transaction_type = type;
    if (symbol) whereClause.symbol = symbol;
    
    const transactions = await findAll('transactions', {
      where: whereClause,
      orderBy: 'created_at DESC',
      limit: parseInt(limit),
      offset: offset
    });
    
    res.json({
      success: true,
      data: transactions,
      total: transactions.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('获取账单明细失败:', err);
    res.status(500).json({ 
      success: false, 
      error: '获取账单明细失败' 
    });
  }
};

// 获取单个账单明细
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await findById('transactions', id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: '账单明细不存在'
      });
    }
    
    res.json({ success: true, data: transaction });
  } catch (err) {
    console.error('获取账单明细失败:', err);
    res.status(500).json({ 
      success: false, 
      error: '获取账单明细失败' 
    });
  }
};

// 创建账单明细
const createTransaction = async (req, res) => {
  try {
    const {
      transaction_type,
      symbol,
      name,
      description,
      amount,
      balance,
      trade_number,
      createdAt
    } = req.body;
    
    // 验证必填字段
    if (!transaction_type || !amount || !balance) {
      return res.status(400).json({
        success: false,
        error: '交易类型、金额和余额为必填字段'
      });
    }
    
    const newTransaction = {
      transaction_type,
      symbol: symbol || null,
      name: name || null,
      description: description || null,
      amount: parseFloat(amount),
      balance: parseFloat(balance),
      trade_number: trade_number || null,
      created_at: createdAt || new Date().toISOString(),
      deleted: false,
      deleted_at: null
    };
    
    console.log('创建账单明细数据:', newTransaction);
    
    const transaction = await create('transactions', newTransaction);
    
    res.json({
      success: true,
      data: transaction,
      message: '账单明细创建成功'
    });
  } catch (err) {
    console.error('创建账单明细失败:', err);
    res.status(500).json({ 
      success: false, 
      error: '创建账单明细失败: ' + err.message 
    });
  }
};

// 更新账单明细
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await findById('transactions', id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: '账单明细不存在'
      });
    }
    
    const updatedData = { ...req.body };
    
    // 转换金额为数字类型
    if (updatedData.amount !== undefined) {
      updatedData.amount = parseFloat(updatedData.amount);
    }
    if (updatedData.balance !== undefined) {
      updatedData.balance = parseFloat(updatedData.balance);
    }
    
    const updatedTransaction = await update('transactions', id, updatedData);
    
    res.json({
      success: true,
      data: updatedTransaction,
      message: '账单明细更新成功'
    });
  } catch (err) {
    console.error('更新账单明细失败:', err);
    res.status(500).json({ 
      success: false, 
      error: '更新账单明细失败' 
    });
  }
};

// 删除账单明细（软删除）
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await findById('transactions', id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: '账单明细不存在'
      });
    }
    
    const deletedTransaction = await remove('transactions', id);
    
    res.json({
      success: true,
      data: deletedTransaction,
      message: '账单明细删除成功'
    });
  } catch (err) {
    console.error('删除账单明细失败:', err);
    res.status(500).json({ 
      success: false, 
      error: '删除账单明细失败' 
    });
  }
};

// 批量删除账单明细
const deleteMultipleTransactions = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供要删除的账单明细ID列表'
      });
    }
    
    const deletedTransactions = await bulkDelete('transactions', ids);
    
    res.json({
      success: true,
      data: deletedTransactions,
      message: `成功删除 ${deletedTransactions.length} 条账单明细`
    });
  } catch (err) {
    console.error('批量删除账单明细失败:', err);
    res.status(500).json({ 
      success: false, 
      error: '批量删除账单明细失败' 
    });
  }
};

// 永久删除账单明细
const permanentDeleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await findById('transactions', id, { includeDeleted: true });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: '账单明细不存在'
      });
    }
    
    await permanentDelete('transactions', id);
    
    res.json({
      success: true,
      message: '账单明细永久删除成功'
    });
  } catch (err) {
    console.error('永久删除账单明细失败:', err);
    res.status(500).json({ 
      success: false, 
      error: '永久删除账单明细失败' 
    });
  }
};

// 恢复已删除的账单明细
const restoreTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await findById('transactions', id, { includeDeleted: true });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: '账单明细不存在'
      });
    }
    
    const restoredTransaction = await restore('transactions', id);
    
    res.json({
      success: true,
      data: restoredTransaction,
      message: '账单明细恢复成功'
    });
  } catch (err) {
    console.error('恢复账单明细失败:', err);
    res.status(500).json({ 
      success: false, 
      error: '恢复账单明细失败' 
    });
  }
};

// 批量恢复账单明细
const restoreMultipleTransactions = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供要恢复的账单明细ID列表'
      });
    }
    
    const restoredTransactions = [];
    for (const id of ids) {
      const restored = await restore('transactions', id);
      if (restored) {
        restoredTransactions.push(restored);
      }
    }
    
    res.json({
      success: true,
      data: restoredTransactions,
      message: `成功恢复 ${restoredTransactions.length} 条账单明细`
    });
  } catch (err) {
    console.error('批量恢复账单明细失败:', err);
    res.status(500).json({ 
      success: false, 
      error: '批量恢复账单明细失败' 
    });
  }
};

// 批量永久删除账单明细
const permanentDeleteMultipleTransactions = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供要永久删除的账单明细ID列表'
      });
    }
    
    const permanentDeletedCount = await permanentDelete('transactions', ids);
    
    res.json({
      success: true,
      data: { count: permanentDeletedCount },
      message: `成功永久删除 ${permanentDeletedCount} 条账单明细`
    });
  } catch (err) {
    console.error('批量永久删除账单明细失败:', err);
    res.status(500).json({ 
      success: false, 
      error: '批量永久删除账单明细失败' 
    });
  }
};

// 根据交易编号删除账单明细
const deleteTransactionsByTradeNumber = async (req, res) => {
  try {
    const { trade_number } = req.params;
    
    if (!trade_number) {
      return res.status(400).json({
        success: false,
        error: '交易编号为必填参数'
      });
    }
    
    // 先查找匹配的账单明细
    const transactions = await findAll('transactions', {
      where: { trade_number },
      includeDeleted: false
    });
    
    if (transactions.length === 0) {
      return res.json({
        success: true,
        data: { count: 0 },
        message: '未找到对应交易编号的账单明细'
      });
    }
    
    // 批量删除这些账单明细
    const ids = transactions.map(t => t.id);
    const deletedCount = await bulkDelete('transactions', ids);
    
    res.json({
      success: true,
      data: { count: deletedCount },
      message: `成功删除 ${deletedCount} 条账单明细`
    });
  } catch (err) {
    console.error('根据交易编号删除账单明细失败:', err);
    res.status(500).json({ 
      success: false, 
      error: '根据交易编号删除账单明细失败: ' + err.message 
    });
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  deleteMultipleTransactions,
  permanentDeleteTransaction,
  restoreTransaction,
  restoreMultipleTransactions,
  permanentDeleteMultipleTransactions,
  deleteTransactionsByTradeNumber
};