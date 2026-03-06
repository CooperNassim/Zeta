import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Calendar, Clock, DollarSign } from 'lucide-react'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import useStore from '../store/useStore'

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const TradeRecords = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const pageSize = 20

  const tradeRecords = useStore(state => state.tradeRecords)

  // 筛选交易记录
  const filteredRecords = (() => {
    switch (selectedFilter) {
      case 'profit':
        return tradeRecords.filter(r => parseFloat(r.profit) > 0)
      case 'loss':
        return tradeRecords.filter(r => parseFloat(r.profit) < 0)
      case 'all':
      default:
        return tradeRecords
    }
  })()

  // 计算统计数据
  const stats = {
    totalTrades: tradeRecords.length,
    profitTrades: tradeRecords.filter(r => parseFloat(r.profit) > 0).length,
    lossTrades: tradeRecords.filter(r => parseFloat(r.profit) < 0).length,
    totalProfit: tradeRecords.reduce((sum, r) => sum + parseFloat(r.profit), 0),
    winRate: tradeRecords.length > 0
      ? (tradeRecords.filter(r => parseFloat(r.profit) > 0).length / tradeRecords.length * 100).toFixed(2)
      : 0
  }

  const totalPages = Math.ceil(filteredRecords.length / pageSize)
  const paginatedData = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '10px', paddingRight: '10px', position: 'relative', paddingBottom: '10px' }}>
        {/* 内容区域 */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* 统计卡片 */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexShrink: 0 }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '15px 20px',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>总交易数</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#374151' }}>{stats.totalTrades}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '15px 20px',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>盈利交易</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{stats.profitTrades}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '15px 20px',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>亏损交易</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{stats.lossTrades}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '15px 20px',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>胜率</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#374151' }}>{stats.winRate}%</p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-gray-500" />
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '15px 20px',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>总盈亏</p>
                <p style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: parseFloat(stats.totalProfit) >= 0 ? '#16a34a' : '#dc2626'
                }}>
                  {parseFloat(stats.totalProfit) >= 0 ? '+' : ''}${parseFloat(stats.totalProfit).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-gray-500" />
            </div>
          </div>

          {/* 筛选器 */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexShrink: 0 }}>
            {[
              { key: 'all', label: '全部交易' },
              { key: 'profit', label: '盈利交易' },
              { key: 'loss', label: '亏损交易' }
            ].map((filter) => (
              <div
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key)}
                style={{
                  background: '#ffffff',
                  border: selectedFilter === filter.key ? '2px solid #0F1419' : '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '14px'
                }}
              >
                {filter.label}
              </div>
            ))}
          </div>

          {/* 表格 */}
          {paginatedData.length > 0 ? (
            <DataTable
              fields={[
                { key: 'symbol', label: '股票代码', width: '100px' },
                { key: 'name', label: '股票名称', width: '120px' },
                { key: 'buyInfo', label: '买入信息', width: '180px' },
                { key: 'sellInfo', label: '卖出信息', width: '180px' },
                { key: 'holdDuration', label: '持仓天数', width: '100px' },
                { key: 'profit', label: '盈亏金额', width: '120px' },
                { key: 'profitPercent', label: '盈亏比例', width: '120px' },
                { key: 'grades', label: '操作评分', width: '150px' },
                { key: 'overallScore', label: '整体评分', width: '120px' },
                { key: 'createdAt', label: '记录时间', width: '180px' }
              ]}
              data={paginatedData}
              selectedIds={[]}
              onSelectAll={() => {}}
              onSelectOne={() => {}}
              renderCell={(field, item) => {
                if (field.key === 'buyInfo') {
                  return (
                    <div style={{ fontSize: '12px' }}>
                      <div>${item.buyPrice.toFixed(2)}</div>
                      <div style={{ color: '#666' }}>{item.buyQuantity}股</div>
                      <div style={{ color: '#666' }}>{formatDate(item.buyTime)}</div>
                    </div>
                  )
                }
                if (field.key === 'sellInfo') {
                  return (
                    <div style={{ fontSize: '12px' }}>
                      <div>${item.sellPrice.toFixed(2)}</div>
                      <div style={{ color: '#666' }}>{item.sellQuantity}股</div>
                      <div style={{ color: '#666' }}>{formatDate(item.sellTime)}</div>
                    </div>
                  )
                }
                if (field.key === 'profit') {
                  const profit = parseFloat(item.profit)
                  return (
                    <span style={{
                      color: profit >= 0 ? '#16a34a' : '#dc2626',
                      fontWeight: 'bold'
                    }}>
                      {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                    </span>
                  )
                }
                if (field.key === 'profitPercent') {
                  const percent = parseFloat(item.profitPercent)
                  return (
                    <span style={{
                      color: percent >= 0 ? '#16a34a' : '#dc2626',
                      fontWeight: 'bold'
                    }}>
                      {percent >= 0 ? '+' : ''}{percent.toFixed(2)}%
                    </span>
                  )
                }
                if (field.key === 'grades') {
                  return (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: item.buyGrade === 'A' ? '#dcfce7' : item.buyGrade === 'B' ? '#fef9c3' : '#fee2e2'
                      }}>
                        买{item.buyGrade}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: item.sellGrade === 'A' ? '#dcfce7' : item.sellGrade === 'B' ? '#fef9c3' : '#fee2e2'
                      }}>
                        卖{item.sellGrade}
                      </span>
                    </div>
                  )
                }
                if (field.key === 'overallScore') {
                  return (
                    <div style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      background: item.overallScore >= 70 ? '#dcfce7' : item.overallScore >= 40 ? '#fef9c3' : '#fee2e2',
                      color: item.overallScore >= 70 ? '#16a34a' : item.overallScore >= 40 ? '#854d0e' : '#dc2626'
                    }}>
                      {item.overallScore.toFixed(1)}
                    </div>
                  )
                }
                if (field.key === 'createdAt') {
                  return formatDate(item.createdAt)
                }
                if (field.key === 'holdDuration') {
                  return `${item.holdDuration}天`
                }
                return null
              }}
            />
          ) : (
            <EmptyState
              message={tradeRecords.length === 0 ? '暂无交易记录' : '未找到匹配的交易记录'}
              icon={TrendingUp}
            />
          )}
        </div>

        {/* 分页器 */}
        <div style={{ position: 'absolute', right: '0', bottom: '0', height: '50px', zIndex: '10', width: '100%' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            selectedCount={0}
            totalCount={filteredRecords.length}
          />
        </div>
      </div>
    </div>
  )
}

export default TradeRecords
