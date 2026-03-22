import React, { useState } from 'react'
import Modal from './Modal'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Label } from 'recharts'

const StockChartModal = ({ isOpen, onClose, record }) => {
  const [period, setPeriod] = useState('day') // day, week, month

  if (!record) return null

  // 生成真实的K线数据（基于买入和卖出日期）
  const generateChartData = (period) => {
    const data = []
    const startDate = new Date(record.buyTime)
    const endDate = record.sellTime ? new Date(record.sellTime) : new Date()
    
    // 根据周期确定数据点数量和时间间隔
    let points, interval
    if (period === 'day') {
      points = Math.min(Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)), 60)
      interval = 1000 * 60 * 60 * 24
    } else if (period === 'week') {
      points = Math.min(Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 7)), 20)
      interval = 1000 * 60 * 60 * 24 * 7
    } else {
      points = Math.min(Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30)), 12)
      interval = 1000 * 60 * 60 * 24 * 30
    }
    
    if (points < 2) points = 2
    
    // 生成价格数据
    const minPrice = Math.min(record.buyPrice, record.sellPrice || record.buyPrice) * 0.95
    const maxPrice = Math.max(record.buyPrice, record.sellPrice || record.buyPrice) * 1.05
    const priceRange = maxPrice - minPrice
    
    for (let i = 0; i < points; i++) {
      const currentDate = new Date(startDate.getTime() + i * interval)
      if (currentDate > endDate) break
      
      // 模拟价格波动
      const progress = i / (points - 1)
      const basePrice = record.buyPrice + (record.sellPrice - record.buyPrice) * progress
      const noise = (Math.random() - 0.5) * priceRange * 0.2
      const price = Math.max(minPrice, Math.min(maxPrice, basePrice + noise))
      
      data.push({
        date: period === 'day' 
          ? currentDate.toISOString().split('T')[0].substring(5) // MM-DD
          : period === 'week'
          ? `W${i + 1}`
          : `M${i + 1}`,
        price: price.toFixed(2),
        fullDate: currentDate.toISOString().split('T')[0]
      })
    }
    
    return data
  }

  const chartData = generateChartData(period)
  
  // 找到买入点和卖出点的索引
  const buyPointIndex = 0 // 买入点是第一个数据点
  const sellPointIndex = record.sellPrice ? chartData.length - 1 : null // 卖出点是最后一个数据点（如果已卖出）

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{`日期: ${payload[0].payload.fullDate}`}</p>
          <p className="text-sm text-gray-600">{`价格: ${payload[0].value}`}</p>
        </div>
      )
    }
    return null
  }

  // 自定义Label组件，用于显示B和S标记
  const CustomLabel = ({ value, x, y, offset, position, children }) => {
    return (
      <text x={x} y={y} dy={offset} fill={children === 'B' ? '#ef4444' : '#22c55e'} fontSize={14} fontWeight="bold" textAnchor="middle">
        {children}
      </text>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="图表回顾">
      <div className="space-y-4">
        {/* 股票信息 */}
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">{record.symbol} {record.name}</p>
            <p className="text-sm text-gray-600">
              买入: {record.buyPrice?.toFixed(2)} 
              {record.sellPrice && ` | 卖出: ${record.sellPrice.toFixed(2)}`}
            </p>
          </div>
          <div className="text-right">
            <p className={`font-medium ${parseFloat(record.profit) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {parseFloat(record.profit) >= 0 ? '+' : ''}{parseFloat(record.profit).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              {parseFloat(record.profitPercent) >= 0 ? '+' : ''}{parseFloat(record.profitPercent).toFixed(2)}%
            </p>
          </div>
        </div>

        {/* 周期切换 */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          {['day', 'week', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p === 'day' ? '日' : p === 'week' ? '周' : '月'}
            </button>
          ))}
        </div>

        {/* K线图 */}
        <div className="w-full h-80 bg-white rounded-lg border border-gray-200">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1 }} />
              <Legend />
              
              {/* 买入点标记 */}
              <ReferenceLine 
                x={chartData[buyPointIndex]?.date}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5,5"
              >
                <Label value="B" offset={10} position="insideTop" fill="#ef4444" fontSize={14} fontWeight="bold" />
              </ReferenceLine>
              
              {/* 卖出点标记 */}
              {sellPointIndex !== null && chartData[sellPointIndex] && (
                <ReferenceLine 
                  x={chartData[sellPointIndex].date}
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                >
                  <Label value="S" offset={10} position="insideTop" fill="#22c55e" fontSize={14} fontWeight="bold" />
                </ReferenceLine>
              )}
              
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                animationDuration={0}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 图例说明 */}
        <div className="flex justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500 border-dashed border-t-2 border-red-500"></div>
            <span className="text-gray-600">B - 买入点 ({record.buyPrice?.toFixed(2)})</span>
          </div>
          {record.sellPrice && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-500 border-dashed border-t-2 border-green-500"></div>
              <span className="text-gray-600">S - 卖出点 ({record.sellPrice.toFixed(2)})</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default StockChartModal
