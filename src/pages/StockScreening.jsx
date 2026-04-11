import React, { useState, useEffect } from 'react'
import { Search, Filter, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react'
import useStore from '../store/useStore'

const StockScreening = () => {
  const store = useStore()
  const [filteredStocks, setFilteredStocks] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minVolume: '',
    maxVolume: '',
    minChange: '',
    maxChange: '',
    industry: '',
    market: ''
  })

  // 获取所有股票数据
  useEffect(() => {
    const stocks = store.stocks || []
    applyFilters(stocks)
  }, [store.stocks, filters, searchTerm])

  const applyFilters = (stocks) => {
    let filtered = [...stocks]

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(stock => 
        stock.symbol?.includes(searchTerm) || 
        stock.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 价格过滤
    if (filters.minPrice) {
      filtered = filtered.filter(stock => stock.current_price >= parseFloat(filters.minPrice))
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(stock => stock.current_price <= parseFloat(filters.maxPrice))
    }

    // 涨跌幅过滤
    if (filters.minChange) {
      filtered = filtered.filter(stock => stock.change_percent >= parseFloat(filters.minChange))
    }
    if (filters.maxChange) {
      filtered = filtered.filter(stock => stock.change_percent <= parseFloat(filters.maxChange))
    }

    setFilteredStocks(filtered)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      minVolume: '',
      maxVolume: '',
      minChange: '',
      maxChange: '',
      industry: '',
      market: ''
    })
    setSearchTerm('')
  }

  return (
    <div style={{ 
      margin: 0, 
      padding: '20px', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <PieChart size={24} />
            股票筛选器
          </h1>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>
            根据股票价格、涨跌幅、成交量等条件筛选股票
          </p>
        </div>

        {/* 搜索和过滤器 */}
        <div style={{ 
          background: '#f8fafc', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="搜索股票代码或名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <button
              onClick={resetFilters}
              style={{
                padding: '12px 20px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              重置筛选
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>最低价格</label>
              <input
                type="number"
                placeholder="0.00"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>最高价格</label>
              <input
                type="number"
                placeholder="100.00"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>最低涨跌幅(%)</label>
              <input
                type="number"
                placeholder="-10"
                value={filters.minChange}
                onChange={(e) => handleFilterChange('minChange', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>最高涨跌幅(%)</label>
              <input
                type="number"
                placeholder="10"
                value={filters.maxChange}
                onChange={(e) => handleFilterChange('maxChange', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        {/* 结果统计 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px',
          background: '#f0f9ff',
          padding: '12px 16px',
          borderRadius: '6px'
        }}>
          <span style={{ fontSize: '14px', color: '#0369a1' }}>
            共找到 <strong>{filteredStocks.length}</strong> 只股票
          </span>
          <Filter size={16} color="#0369a1" />
        </div>

        {/* 股票列表 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '16px' 
        }}>
          {filteredStocks.map((stock, index) => (
            <div 
              key={stock.symbol || index}
              style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1f2937' }}>
                    {stock.symbol}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {stock.name || '未知股票'}
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: stock.change_percent >= 0 ? '#10b981' : '#ef4444'
                }}>
                  {stock.change_percent >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>当前价格</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                    <DollarSign size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    {stock.current_price?.toFixed(2) || '--'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>涨跌幅</div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold',
                    color: stock.change_percent >= 0 ? '#10b981' : '#ef4444'
                  }}>
                    {stock.change_percent?.toFixed(2) || '--'}%
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>昨收</div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    {stock.prev_close?.toFixed(2) || '--'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>更新时间</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {new Date(stock.timestamp).toLocaleTimeString() || '--'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStocks.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#6b7280'
          }}>
            <Filter size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>未找到符合条件的股票，请调整筛选条件</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default StockScreening