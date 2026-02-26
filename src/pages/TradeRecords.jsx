import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, Award, BarChart3 } from 'lucide-react'
import useStore from '../store/useStore'
import { format } from 'date-fns'
import Counter from '../components/Counter'
import ScrollAnimation from '../components/ScrollAnimation'

const TradeRecords = () => {
  const [filterType, setFilterType] = useState('all')

  const tradeRecords = useStore(state => state.tradeRecords)
  const calculateTradeProfit = useStore(state => state.calculateTradeProfit)

  const filteredRecords = filterType === 'all'
    ? tradeRecords
    : tradeRecords.filter(t => t.type === filterType)

  const totalProfit = tradeRecords.reduce((sum, t) => sum + (t.profit || 0), 0)
  const winCount = tradeRecords.filter(t => (t.profit || 0) > 0).length
  const totalCount = tradeRecords.length
  const winRate = totalCount > 0 ? (winCount / totalCount * 100).toFixed(1) : 0

  const updateProfit = (record, profit) => {
    calculateTradeProfit(record.id, parseFloat(profit))
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">交易记录</h1>
          <p className="text-gray-600">查看买入卖出记录和交易统计</p>
        </div>
      </motion.div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ScrollAnimation delay={0.1}>
          <motion.div className="glass rounded-xl p-6 border border-gray-200 hover-float cursor-pointer" whileHover={{ scale: 1.02 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">总交易次数</p>
                <p className="text-3xl font-bold text-gray-900">
                  <Counter end={totalCount} duration={1} />
                </p>
              </div>
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              >
                <BarChart3 className="w-10 h-10 text-primary-600" />
              </motion.div>
            </div>
          </motion.div>
        </ScrollAnimation>
        <ScrollAnimation delay={0.2}>
          <motion.div className="glass rounded-xl p-6 border border-gray-200 hover-float cursor-pointer" whileHover={{ scale: 1.02 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">总盈亏</p>
                <p className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalProfit >= 0 ? '+' : ''}¥{totalProfit.toLocaleString()}
                </p>
              </div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <DollarSign className={`w-10 h-10 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </motion.div>
            </div>
          </motion.div>
        </ScrollAnimation>
        <ScrollAnimation delay={0.3}>
          <motion.div className="glass rounded-xl p-6 border border-gray-200 hover-float cursor-pointer" whileHover={{ scale: 1.02 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">盈利次数</p>
                <p className="text-3xl font-bold text-green-600">
                  <Counter end={winCount} duration={1} />
                </p>
              </div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
              >
                <TrendingUp className="w-10 h-10 text-green-600" />
              </motion.div>
            </div>
          </motion.div>
        </ScrollAnimation>
        <ScrollAnimation delay={0.4}>
          <motion.div className="glass rounded-xl p-6 border border-gray-200 hover-float cursor-pointer" whileHover={{ scale: 1.02 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">胜率</p>
                <p className="text-3xl font-bold text-primary-600">{winRate}%</p>
              </div>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Award className="w-10 h-10 text-primary-600" />
              </motion.div>
            </div>
          </motion.div>
        </ScrollAnimation>
      </div>

      {/* 筛选器 */}
      <div className="flex gap-4">
        {['all', 'buy', 'sell'].map((type) => (
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
            {type === 'all' ? '全部' : type === 'buy' ? '买入' : '卖出'}
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
                <th className="px-6 py-4">执行时间</th>
                <th className="px-6 py-4">类型</th>
                <th className="px-6 py-4">代码</th>
                <th className="px-6 py-4">价格</th>
                <th className="px-6 py-4">数量</th>
                <th className="px-6 py-4">金额</th>
                <th className="px-6 py-4">心理评分</th>
                <th className="px-6 py-4">策略评分</th>
                <th className="px-6 py-4">综合评分</th>
                <th className="px-6 py-4">盈亏</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                    暂无交易记录
                  </td>
                </tr>
              ) : (
                filteredRecords
                  .slice()
                  .reverse()
                  .map((record, index) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                      className="border-b border-gray-200 hover:bg-white transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-700">
                        {format(new Date(record.executedAt), 'yyyy-MM-dd HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded text-xs font-medium ${
                          record.type === 'buy' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                        }`}>
                          {record.type === 'buy' ? '买入' : '卖出'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{record.symbol}</td>
                      <td className="px-6 py-4">¥{record.price.toLocaleString()}</td>
                      <td className="px-6 py-4">{record.quantity}</td>
                      <td className="px-6 py-4">¥{record.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${record.psychologicalScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                          {record.psychologicalScore}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${record.strategyScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                          {record.strategyScore}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${record.overallScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                          {record.overallScore}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {record.type === 'buy' ? (
                          <input
                            type="number"
                            step="0.01"
                            value={record.profit || ''}
                            onChange={(e) => updateProfit(record, e.target.value)}
                            placeholder="¥0.00"
                            className="w-24 px-3 py-1 bg-white border border-gray-200 rounded text-gray-900 text-sm focus:outline-none focus:border-primary-500 transition-colors"
                          />
                        ) : (
                          <span className={`font-bold ${(record.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(record.profit || 0) >= 0 ? '+' : ''}¥{(record.profit || 0).toLocaleString()}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
        </div>
      </ScrollAnimation>

      {/* 交易详情说明 */}
      <ScrollAnimation delay={0.6}>
        <div className="glass rounded-xl border border-gray-200 p-6 hover:border-primary-200 transition-all duration-300">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-primary-600" />
            交易记录说明
          </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">评分体系</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• 心理评分：根据心理测试结果</li>
              <li>• 策略评分：根据交易策略评估</li>
              <li>• 综合评分：综合各项评分计算</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">盈亏计算</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• 买入交易：卖出时可填写盈亏</li>
              <li>• 卖出交易：显示实际盈亏</li>
              <li>• 负值表示亏损，正值表示盈利</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">统计分析</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• 胜率：盈利次数 / 总交易次数</li>
              <li>• 盈亏：所有交易的盈亏总和</li>
              <li>• 根据交易记录评估策略效果</li>
            </ul>
          </div>
        </div>
        </div>
      </ScrollAnimation>
    </div>
  )
}

export default TradeRecords
