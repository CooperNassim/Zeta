import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, ArrowUpCircle, ArrowDownCircle, TrendingUp, Wallet } from 'lucide-react'
import useStore from '../store/useStore'
import { format } from 'date-fns'
import Counter from '../components/Counter'
import ScrollAnimation from '../components/ScrollAnimation'

const TransactionHistory = () => {
  const [showModal, setShowModal] = useState(false)
  const [filterType, setFilterType] = useState('all')

  const transactions = useStore(state => state.transactions)
  const account = useStore(state => state.account)
  const addTransaction = useStore(state => state.addTransaction)

  const [transactionForm, setTransactionForm] = useState({
    type: 'income',
    amount: '',
    description: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    addTransaction({
      type: transactionForm.type === 'income' ? '入账' : '出账',
      amount: transactionForm.type === 'income' ? parseFloat(transactionForm.amount) : -parseFloat(transactionForm.amount),
      description: transactionForm.description,
      balance: account.balance + (transactionForm.type === 'income' ? parseFloat(transactionForm.amount) : -parseFloat(transactionForm.amount))
    })
    setShowModal(false)
    setTransactionForm({ type: 'income', amount: '', description: '' })
  }

  const filteredTransactions = filterType === 'all'
    ? transactions
    : transactions.filter(t => t.type === filterType)

  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const netChange = totalIncome - totalExpense

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">账单明细</h1>
          <p className="text-gray-600">查看和管理账户资金变动记录</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-primary-500 to-blue-500 rounded-lg text-gray-900 font-medium hover:from-primary-600 hover:to-blue-600 transition-all duration-300 inline-flex items-center shadow-lg shadow-primary-500/30"
        >
          <Plus className="w-5 h-5 mr-2" />
          手动记账
        </motion.button>
      </motion.div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ScrollAnimation delay={0.1}>
          <motion.div className="glass rounded-xl p-6 border border-gray-200 hover-float cursor-pointer" whileHover={{ scale: 1.02 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">当前余额</p>
                <p className="text-3xl font-bold text-gray-900">¥{account.balance.toLocaleString()}</p>
              </div>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              >
                <Wallet className="w-10 h-10 text-primary-600" />
              </motion.div>
            </div>
          </motion.div>
        </ScrollAnimation>
        <ScrollAnimation delay={0.2}>
          <motion.div className="glass rounded-xl p-6 border border-gray-200 hover-float cursor-pointer" whileHover={{ scale: 1.02 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">总收入</p>
                <p className="text-3xl font-bold text-green-600">¥{totalIncome.toLocaleString()}</p>
              </div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ArrowUpCircle className="w-10 h-10 text-green-600" />
              </motion.div>
            </div>
          </motion.div>
        </ScrollAnimation>
        <ScrollAnimation delay={0.3}>
          <motion.div className="glass rounded-xl p-6 border border-gray-200 hover-float cursor-pointer" whileHover={{ scale: 1.02 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">总支出</p>
                <p className="text-3xl font-bold text-red-600">¥{totalExpense.toLocaleString()}</p>
              </div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
              >
                <ArrowDownCircle className="w-10 h-10 text-red-600" />
              </motion.div>
            </div>
          </motion.div>
        </ScrollAnimation>
        <ScrollAnimation delay={0.4}>
          <motion.div className="glass rounded-xl p-6 border border-gray-200 hover-float cursor-pointer" whileHover={{ scale: 1.02 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">净变化</p>
                <p className={`text-3xl font-bold ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netChange >= 0 ? '+' : ''}¥{netChange.toLocaleString()}
                </p>
              </div>
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              >
                <TrendingUp className={`w-10 h-10 ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </motion.div>
            </div>
          </motion.div>
        </ScrollAnimation>
      </div>

      {/* 筛选器 */}
      <div className="flex gap-4">
        {['all', '入账', '出账', '买入', '卖出'].map((type) => (
          <motion.button
            key={type}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilterType(type)}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              filterType === type
                ? 'bg-gradient-to-r from-primary-500 to-blue-500 text-gray-900 shadow-lg shadow-primary-500/30'
                : 'glass text-gray-600 hover:text-gray-900'
            }`}
          >
            {type === 'all' ? '全部' : type}
          </motion.button>
        ))}
      </div>

      {/* 交易记录列表 */}
      <ScrollAnimation delay={0.5}>
        <div className="glass rounded-xl border border-gray-200 overflow-hidden hover:border-primary-200 transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-600 text-sm border-b border-gray-200">
                <th className="px-6 py-4">时间</th>
                <th className="px-6 py-4">类型</th>
                <th className="px-6 py-4">代码</th>
                <th className="px-6 py-4">描述</th>
                <th className="px-6 py-4">金额</th>
                <th className="px-6 py-4">余额</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    暂无账单记录
                  </td>
                </tr>
              ) : (
                filteredTransactions
                  .slice()
                  .reverse()
                  .map((transaction, index) => (
                    <motion.tr
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                      className="border-b border-gray-200 hover:bg-white transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-700">
                        {format(new Date(transaction.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            transaction.type === '入账' || transaction.type === '卖出'
                              ? 'bg-green-500/20 text-green-600'
                              : transaction.type === '出账' || transaction.type === '买入'
                              ? 'bg-red-500/20 text-red-600'
                              : 'bg-primary-50 text-primary-600'
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {transaction.symbol || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {transaction.description || '-'}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {transaction.amount >= 0 ? '+' : ''}¥{Math.abs(transaction.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        ¥{(transaction.balance || account.balance).toLocaleString()}
                      </td>
                    </motion.tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
        </div>
      </ScrollAnimation>

      {/* 手动记账弹窗 */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl border border-gray-300 w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">手动记账</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">类型</label>
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="income"
                      checked={transactionForm.type === 'income'}
                      onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
                      className="hidden"
                    />
                    <div className={`p-4 rounded-lg border-2 text-center transition-all ${
                      transactionForm.type === 'income'
                        ? 'border-green-500 bg-green-500/20 text-green-600'
                        : 'border-gray-300 text-gray-600 hover:border-green-500/50'
                    }`}>
                      <ArrowUpCircle className="w-6 h-6 mx-auto mb-2" />
                      <p className="font-medium">入账</p>
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="expense"
                      checked={transactionForm.type === 'expense'}
                      onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
                      className="hidden"
                    />
                    <div className={`p-4 rounded-lg border-2 text-center transition-all ${
                      transactionForm.type === 'expense'
                        ? 'border-red-500 bg-red-500/20 text-red-600'
                        : 'border-gray-300 text-gray-600 hover:border-red-500/50'
                    }`}>
                      <ArrowDownCircle className="w-6 h-6 mx-auto mb-2" />
                      <p className="font-medium">出账</p>
                    </div>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">金额 (¥)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                  placeholder="例如：2000.00"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">描述</label>
                <textarea
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                  placeholder="例如：生活费充值"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
                >
                  取消
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-blue-500 rounded-lg text-gray-900 font-medium hover:from-primary-600 hover:to-blue-600 transition-all"
                >
                  保存
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default TransactionHistory
