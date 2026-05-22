import React, { useState, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Loader2, TrendingUp, TrendingDown, Sparkles, ChevronRight, Star, Clock, Filter, X, Zap } from 'lucide-react'
import { parseStockScreenConditions, conditionToDisplayText, validateConditions } from '../utils/stockScreen/conditionParser'

const StockScreener = () => {
  const navigate = useNavigate()
  const [inputText, setInputText] = useState('')
  const [parsedConditions, setParsedConditions] = useState([])
  const [isScreening, setIsScreening] = useState(false)
  const [screenResults, setScreenResults] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('D')
  const [activeTab, setActiveTab] = useState('input') // 'input' | 'recent' | 'templates'
  const [recentConditions, setRecentConditions] = useState(() => {
    try {
      const saved = localStorage.getItem('stock_screener_recent')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  // 常用模板
  const templates = useMemo(() => [
    {
      name: '均线多头排列',
      text: '5日均线 > 10日均线；10日均线 > 20日均线；20日均线 > 60日均线；股价 > 5日均线',
      category: '技术面',
    },
    {
      name: 'MACD金叉',
      text: 'MACD_DIF > MACD_DEA；MACD柱 > 0',
      category: '技术面',
    },
    {
      name: '布林带突破',
      text: '股价 > 布林上轨',
      category: '技术面',
    },
    {
      name: 'RSI超卖反弹',
      text: 'RSI < 30',
      category: '技术面',
    },
    {
      name: '放量上涨',
      text: '涨幅 > 3%；成交量 > 5日均量',
      category: '技术面',
    },
    {
      name: '周线EMA金叉',
      text: '13周EMA均线 > 26周EMA均线；股价 < 13周EMA均线',
      category: '技术面',
    },
    {
      name: '仅主板',
      text: '仅主板；不含st',
      category: '基本面',
    },
    {
      name: '涨停股',
      text: '涨停；不含st',
      category: '消息面',
    },
  ], [])

  // 解析输入文本
  const handleParse = useCallback(() => {
    if (!inputText.trim()) {
      setParsedConditions([])
      return
    }
    const conditions = parseStockScreenConditions(inputText)
    setParsedConditions(conditions)
  }, [inputText])

  // 执行选股
  const handleScreen = useCallback(async () => {
    if (parsedConditions.length === 0) {
      handleParse()
      if (!inputText.trim()) return
    }

    const conditions = parsedConditions.length > 0 ? parsedConditions : parseStockScreenConditions(inputText)
    if (conditions.length === 0) return

    const validation = validateConditions(conditions)
    if (!validation.valid) {
      alert(`条件解析有问题：\n${validation.errors.map(e => `${e.condition}: ${e.error}`).join('\n')}`)
      return
    }

    setIsScreening(true)
    setScreenResults([])

    try {
      const response = await fetch(`${backendUrl}/api/market/screen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conditions,
          period: selectedPeriod,
          limit: 100,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setScreenResults(result.data)
        setActiveTab('results')

        // 保存到最近使用
        const newRecent = [{ text: inputText, conditions, time: Date.now() }, ...recentConditions.slice(0, 9)]
        setRecentConditions(newRecent)
        localStorage.setItem('stock_screener_recent', JSON.stringify(newRecent))
      } else {
        alert(`筛选失败：${result.error}`)
      }
    } catch (error) {
      console.error('[StockScreener] 筛选失败:', error)
      alert('筛选失败，请检查后端服务是否正常运行')
    } finally {
      setIsScreening(false)
    }
  }, [parsedConditions, inputText, selectedPeriod, recentConditions])

  // 选择模板
  const handleSelectTemplate = useCallback((template) => {
    setInputText(template.text)
    setActiveTab('input')
  }, [])

  // 选择最近使用
  const handleSelectRecent = useCallback((recent) => {
    setInputText(recent.text)
    setActiveTab('input')
  }, [])

  // 查看股票图表
  const handleViewChart = useCallback((stock) => {
    navigate(`/stock-chart?symbol=${stock.symbol}&name=${encodeURIComponent(stock.name || '')}`)
  }, [navigate])

  // 渲染条件标签
  const renderConditionTags = (conditions) => {
    return conditions.map((condition, idx) => {
      const displayText = conditionToDisplayText(condition)
      const isValid = condition.type !== 'unknown'

      return (
        <div
          key={idx}
          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${
            isValid
              ? 'bg-red-50 text-red-600 border border-red-100'
              : 'bg-gray-100 text-gray-400 border border-gray-200'
          }`}
        >
          {displayText}
          {!isValid && (
            <span className="ml-1 text-gray-300" title="无法解析">
              ?
            </span>
          )}
        </div>
      )
    })
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', position: 'relative' }}>
        {/* 头部 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#fff', flexShrink: 0 }}>
          <button
            onClick={() => navigate('/stock-pool')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">筛选股票</h1>
            <p className="text-xs text-gray-400 mt-0.5">一句话选股，智能解析筛选条件</p>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {['D', 'W', 'M'].map(p => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedPeriod === p
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p === 'D' ? '日线' : p === 'W' ? '周线' : '月线'}
              </button>
            ))}
          </div>
        </div>

        {/* 标签切换 */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e5e7eb', background: '#fff', flexShrink: 0 }}>
          {[
            { key: 'input', label: '一句话选股', icon: Sparkles },
            { key: 'recent', label: '最近使用', icon: Clock },
            { key: 'templates', label: '常用模板', icon: Star },
            { key: 'results', label: `筛选结果${screenResults.length > 0 ? ` (${screenResults.length})` : ''}`, icon: Filter },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {/* 输入模式 */}
          {activeTab === 'input' && (
            <div className="space-y-6">
              {/* 输入框 */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  输入选股条件
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleScreen()
                    }
                  }}
                  placeholder="例如：13周EMA均线 > 26周EMA均线；股价 < 13周EMA均线；不含北交所；不含st"
                  className="w-full h-24 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">
                    Ctrl+Enter 快速筛选
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleParse}
                      className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      解析条件
                    </button>
                    <button
                      onClick={handleScreen}
                      disabled={isScreening || !inputText.trim()}
                      className="px-4 py-2 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {isScreening ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          筛选中...
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5" />
                          查看结果
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 解析后的条件 */}
              {parsedConditions.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800">
                      解析为如下条件 (共{parsedConditions.length}个)
                    </h3>
                    {validateConditions(parsedConditions).valid && (
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        全部可解析
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {renderConditionTags(parsedConditions)}
                  </div>
                </div>
              )}

              {/* 示例提示 */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">使用提示</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• 支持均线(MA/EMA/EXPMA)、布林带(BOLL)、MACD、RSI、KDJ等指标</li>
                  <li>• 支持多周期：日线、周线、月线</li>
                  <li>• 支持条件：大于{'>'}、小于{'<'}、等于{'='}、上穿、下穿</li>
                  <li>• 支持特殊条件：不含st、不含北交所、仅主板、涨停等</li>
                  <li>• 多个条件用分号(；)或逗号(,)分隔</li>
                </ul>
              </div>
            </div>
          )}

          {/* 最近使用 */}
          {activeTab === 'recent' && (
            <div className="space-y-3">
              {recentConditions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">暂无最近使用的选股条件</p>
                </div>
              ) : (
                recentConditions.map((recent, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectRecent(recent)}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">
                        {new Date(recent.time).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{recent.text}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {recent.conditions.map((c, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
                          {conditionToDisplayText(c)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 常用模板 */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectTemplate(template)}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-800 group-hover:text-blue-600">
                      {template.name}
                    </h4>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                      {template.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{template.text}</p>
                  <div className="flex items-center justify-end mt-2">
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 筛选结果 */}
          {activeTab === 'results' && (
            <div className="space-y-3">
              {screenResults.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">暂无筛选结果</p>
                  <p className="text-xs mt-1">请在"一句话选股"中输入条件进行筛选</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm text-gray-500">
                      共找到 <span className="text-blue-600 font-semibold">{screenResults.length}</span> 只股票
                    </span>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">股票代码</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">股票名称</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">最新价</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">涨跌幅</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">成交量</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {screenResults.map((stock, idx) => {
                          const isPositive = stock.changePercent > 0
                          const isNegative = stock.changePercent < 0
                          return (
                            <tr
                              key={stock.symbol}
                              className={`border-b border-gray-100 hover:bg-blue-50 cursor-pointer ${
                                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                              }`}
                            >
                              <td className="px-4 py-3 font-mono text-xs text-gray-500">{stock.symbol}</td>
                              <td className="px-4 py-3">
                                <span className="font-medium text-gray-800">{stock.name}</span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-sm">
                                {stock.currentPrice != null ? stock.currentPrice.toFixed(2) : '-'}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`font-medium ${isPositive ? 'text-red-600' : isNegative ? 'text-green-600' : 'text-gray-400'}`}>
                                  {stock.changePercent != null ? (stock.changePercent >= 0 ? '+' : '') + stock.changePercent.toFixed(2) + '%' : '-'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-xs text-gray-500">
                                {stock.volume ? (stock.volume / 10000).toFixed(0) + '万' : '-'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewChart(stock)
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  查看图表
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StockScreener
