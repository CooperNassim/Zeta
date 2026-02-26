import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react'
import useStore from '../store/useStore'
import { format } from 'date-fns'
import Counter from '../components/Counter'
import ScrollAnimation from '../components/ScrollAnimation'

const DailyWork = () => {
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    price: '',
    change: '',
    type: 'stock'
  })

  const assetPrices = useStore(state => state.assetPrices)
  const addAssetPrice = useStore(state => state.addAssetPrice)
  const deleteAssetPrice = useStore(state => state.deleteAssetPrice)

  const handleSubmit = (e) => {
    e.preventDefault()
    addAssetPrice({
      ...formData,
      price: parseFloat(formData.price),
      change: parseFloat(formData.change),
      date: new Date().toISOString()
    })
    setShowModal(false)
    setFormData({ symbol: '', name: '', price: '', change: '', type: 'stock' })
  }

  const sortedPrices = [...assetPrices].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">每日功课</h1>
          <p className="text-gray-600">维护全球资产价格指数，及时更新市场动态</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-primary-500 rounded-lg text-gray-900 font-medium hover:bg-primary-600 transition-all duration-300 inline-flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          添加资产价格
        </motion.button>
      </motion.div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ScrollAnimation delay={0.1}>
          <motion.div className="glass rounded-xl p-6 border border-gray-200 hover-float cursor-pointer" whileHover={{ scale: 1.02 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">总资产数</p>
                <p className="text-3xl font-bold text-gray-900">
                  <Counter end={assetPrices.length} duration={1} />
                </p>
              </div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <TrendingUp className="w-10 h-10 text-primary-500" />
              </motion.div>
            </div>
          </motion.div>
        </ScrollAnimation>
        <ScrollAnimation delay={0.2}>
          <motion.div className="glass rounded-xl p-6 border border-gray-200 hover-float cursor-pointer" whileHover={{ scale: 1.02 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">上涨资产</p>
                <p className="text-3xl font-bold text-green-600">
                  <Counter end={assetPrices.filter(p => p.change > 0).length} duration={1} />
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
        <ScrollAnimation delay={0.3}>
          <motion.div className="glass rounded-xl p-6 border border-gray-200 hover-float cursor-pointer" whileHover={{ scale: 1.02 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">下跌资产</p>
                <p className="text-3xl font-bold text-red-600">
                  <Counter end={assetPrices.filter(p => p.change < 0).length} duration={1} />
                </p>
              </div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
              >
                <TrendingDown className="w-10 h-10 text-red-600" />
              </motion.div>
            </div>
          </motion.div>
        </ScrollAnimation>
        <ScrollAnimation delay={0.4}>
          <motion.div className="glass rounded-xl p-6 border border-gray-200 hover-float cursor-pointer" whileHover={{ scale: 1.02 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">最后更新</p>
                <p className="text-lg font-bold text-gray-900">
                  {assetPrices.length > 0 ? format(new Date(sortedPrices[0]?.date), 'MM-dd HH:mm') : '-'}
                </p>
              </div>
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              >
                <Calendar className="w-10 h-10 text-primary-500" />
              </motion.div>
            </div>
          </motion.div>
        </ScrollAnimation>
      </div>

      {/* 资产价格列表 */}
      <ScrollAnimation delay={0.5}>
        <div className="glass rounded-xl border border-gray-200 overflow-hidden hover:border-primary-200 transition-all duration-300">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-primary-500" />
            资产价格列表
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-600 text-sm border-b border-gray-200">
                <th className="px-6 py-4">日期</th>
                <th className="px-6 py-4">代码</th>
                <th className="px-6 py-4">名称</th>
                <th className="px-6 py-4">类型</th>
                <th className="px-6 py-4">价格</th>
                <th className="px-6 py-4">涨跌</th>
                <th className="px-6 py-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedPrices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    暂无资产价格数据，点击右上角添加
                  </td>
                </tr>
              ) : (
                sortedPrices.map((price, index) => (
                  <motion.tr
                    key={price.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-b border-gray-200 hover:bg-white transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-700">
                      {format(new Date(price.date), 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{price.symbol}</td>
                    <td className="px-6 py-4 text-gray-700">{price.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-primary-50 text-primary-500">
                        {price.type === 'stock' ? '股票' : price.type === 'crypto' ? '加密货币' : '外汇'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      ¥{price.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center font-medium ${
                        price.change > 0 ? 'text-green-600' : price.change < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {price.change > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : price.change < 0 ? <TrendingDown className="w-4 h-4 mr-1" /> : null}
                        {price.change > 0 ? '+' : ''}{price.change.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteAssetPrice(price.id)}
                        className="p-2 text-red-600 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>
      </ScrollAnimation>

      {/* 添加资产价格弹窗 */}
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
            <h3 className="text-2xl font-bold text-gray-900 mb-6">添加资产价格</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">资产代码</label>
                <input
                  type="text"
                  required
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  placeholder="例如：AAPL"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">资产名称</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：苹果公司"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">资产类型</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-primary-500 transition-colors"
                >
                  <option value="stock">股票</option>
                  <option value="crypto">加密货币</option>
                  <option value="forex">外汇</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">当前价格</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="例如：150.50"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">涨跌幅 (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.change}
                  onChange={(e) => setFormData({ ...formData, change: e.target.value })}
                  placeholder="例如：2.5"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
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
                  className="flex-1 px-4 py-3 bg-primary-500 rounded-lg text-gray-900 font-medium hover:bg-primary-600 transition-all"
                >
                  添加
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default DailyWork
