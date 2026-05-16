import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown, Camera, Maximize2, Minus, Plus } from 'lucide-react'
import { init, dispose } from 'klinecharts'

const PERIOD_CONFIG = {
  '1m': { type: 'minute', span: 1, label: '1分' },
  '5m': { type: 'minute', span: 5, label: '5分' },
  '15m': { type: 'minute', span: 15, label: '15分' },
  '30m': { type: 'minute', span: 30, label: '30分' },
  '60m': { type: 'minute', span: 60, label: '60分' },
  'D': { type: 'day', span: 1, label: '日线' },
  'W': { type: 'week', span: 1, label: '周线' },
  'M': { type: 'month', span: 1, label: '月线' },
}

const INDICATOR_NAMES = ['MA', 'BOLL', 'MACD', 'RSI', 'KDJ', 'DMI', 'OBV']

const PERIOD_LIST = Object.keys(PERIOD_CONFIG)

function StockChart() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const symbol = searchParams.get('symbol') || ''
  const name = searchParams.get('name') || ''

  const chartRef = useRef(null)
  const chartInstanceRef = useRef(null)
  const [period, setPeriod] = useState('D')
  const [indicator, setIndicator] = useState('MA')
  const [latestPrice, setLatestPrice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chartReady, setChartReady] = useState(false)

  const periodRef = useRef(period)
  const symbolRef = useRef(symbol)

  periodRef.current = period
  symbolRef.current = symbol

  // Fetch data from backend API (uses symbol directly, not via closure)
  const fetchData = useCallback(async (targetPeriod) => {
    const currentSymbol = symbolRef.current
    if (!currentSymbol) return []

    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

    try {
      // 获取K线数据（必须成功）
      const klineRes = await fetch(`${backendUrl}/api/market/kline?provider=eastmoney&symbol=${currentSymbol}&period=${targetPeriod}&limit=200`)
      const klineResult = await klineRes.json()

      if (!klineResult.success || !klineResult.data || klineResult.data.length === 0) {
        return []
      }

      const klineData = klineResult.data.map(item => ({
        timestamp: new Date(item.date).getTime(),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume || 0),
        turnover: parseFloat(item.amount || 0),
      }))

      // 尝试获取预计算指标（失败不影响K线显示）
      try {
        const indicatorRes = await fetch(`${backendUrl}/api/market/indicators?symbol=${currentSymbol}&period=${targetPeriod}`)
        const indicatorResult = await indicatorRes.json()

        if (indicatorResult.success && indicatorResult.data && indicatorResult.data.length > 0) {
          console.log('[StockChart] 使用预计算指标，数量:', indicatorResult.data.length)
          
          // 建立日期->指标的映射
          const indicatorMap = new Map()
          indicatorResult.data.forEach(ind => {
            indicatorMap.set(ind.trade_date, ind)
          })

          // 合并指标到K线数据
          klineData.forEach(kline => {
            const dateStr = new Date(kline.timestamp).toISOString().slice(0, 10).replace(/-/g, '')
            const ind = indicatorMap.get(dateStr)
            if (ind) {
              kline.ma5 = ind.ma5 ? parseFloat(ind.ma5) : undefined
              kline.ma10 = ind.ma10 ? parseFloat(ind.ma10) : undefined
              kline.ma20 = ind.ma20 ? parseFloat(ind.ma20) : undefined
              kline.ma30 = ind.ma30 ? parseFloat(ind.ma30) : undefined
              kline.ma60 = ind.ma60 ? parseFloat(ind.ma60) : undefined
              kline.bollMid = ind.boll_mid ? parseFloat(ind.boll_mid) : undefined
              kline.bollUpper = ind.boll_upper ? parseFloat(ind.boll_upper) : undefined
              kline.bollLower = ind.boll_lower ? parseFloat(ind.boll_lower) : undefined
              kline.macdDif = ind.macd_dif ? parseFloat(ind.macd_dif) : undefined
              kline.macdDea = ind.macd_dea ? parseFloat(ind.macd_dea) : undefined
              kline.macdHist = ind.macd_hist ? parseFloat(ind.macd_hist) : undefined
              kline.rsi6 = ind.rsi6 ? parseFloat(ind.rsi6) : undefined
              kline.rsi12 = ind.rsi12 ? parseFloat(ind.rsi12) : undefined
              kline.rsi24 = ind.rsi24 ? parseFloat(ind.rsi24) : undefined
              kline.kdjK = ind.kdj_k ? parseFloat(ind.kdj_k) : undefined
              kline.kdjD = ind.kdj_d ? parseFloat(ind.kdj_d) : undefined
              kline.kdjJ = ind.kdj_j ? parseFloat(ind.kdj_j) : undefined
            }
          })
        }
      } catch (indicatorError) {
        console.warn('[StockChart] 获取预计算指标失败，将仅显示K线:', indicatorError)
      }

      return klineData
    } catch (error) {
      console.error('[StockChart] 获取数据失败:', error)
      return []
    }
  }, [])

  // Update latest price from data
  const updateLatestPrice = useCallback((data) => {
    if (data.length === 0) return

    const last = data[data.length - 1]
    const prevClose = data.length > 1 ? data[data.length - 2].close : last.open
    const change = last.close - prevClose
    const changePercent = prevClose !== 0 ? ((change / prevClose) * 100).toFixed(2) : '0.00'

    setLatestPrice({
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
      volume: last.volume,
      change,
      changePercent,
    })
  }, [])

  // Initialize chart with DataLoader
  useEffect(() => {
    if (!chartRef.current) return

    const chart = init(chartRef.current, {
      locale: 'zh-CN',
      timezone: 'Asia/Shanghai',
      layout: [{ type: 'candle', content: ['MA'], options: { id: 'candle' } }],
      offsetLeftDistance: 0,
      offsetRightDistance: 0,
      styles: {
        grid: {
          horizontal: { show: true, color: '#f3f4f6' },
          vertical: { show: true, color: '#f3f4f6' },
        },
        candle: {
          type: 'candle_solid',
          bar: {
            upColor: '#ef4444',
            downColor: '#22c55e',
            noChangeColor: '#888888',
            upBorderColor: '#ef4444',
            downBorderColor: '#22c55e',
            noChangeBorderColor: '#888888',
            upWickColor: '#ef4444',
            downWickColor: '#22c55e',
            noChangeWickColor: '#888888',
          },
          priceMark: {
            high: { show: false },
            low: { show: false },
            last: { show: true, text: { show: true, size: 10 } },
          },
        },
        indicator: {
          ohlc: {
            upColor: '#ef4444',
            downColor: '#22c55e',
            noChangeColor: '#888888',
          },
        },
        yAxis: {
          show: true,
          width: 40,
          fixedWidth: 40,
          tickText: { show: true, size: 9, color: '#6b7280' },
          tickLine: { show: false },
        },
        xAxis: {
          show: true,
          height: 24,
          tickText: { show: true, size: 9, color: '#6b7280' },
          tickLine: { show: false },
        },
        crosshair: {
          show: true,
          horizontal: {
            show: true,
            line: { color: '#9ca3af', style: 'dashed', size: 1 },
          },
          vertical: {
            show: true,
            line: { color: '#9ca3af', style: 'dashed', size: 1 },
          },
        },
      },
    })

    // Register DataLoader
    chart.setDataLoader({
      getBars: async (params) => {
        const { type, callback } = params
        const currentPeriod = periodRef.current

        setLoading(true)
        const data = await fetchData(currentPeriod)

        if (data.length > 0) {
          updateLatestPrice(data)
          callback(data, false)
        } else {
          callback([], false)
        }
        setLoading(false)
      },
    })

    // Create candle indicator
    chart.createIndicator('candle', false, { paneId: 'candle' })

    chartInstanceRef.current = chart
    setChartReady(true)

    return () => {
      if (chartRef.current) {
        dispose(chartRef.current)
        chartInstanceRef.current = null
      }
    }
  }, [fetchData, updateLatestPrice])

  // Set symbol, period and trigger data load
  useEffect(() => {
    if (!chartReady || !chartInstanceRef.current || !symbol) return

    const chart = chartInstanceRef.current
    const cfg = PERIOD_CONFIG[period] || PERIOD_CONFIG['D']

    // Set symbol first, then period. setPeriod triggers data load via DataLoader
    chart.setSymbol({ ticker: symbol, pricePrecision: 2, volumePrecision: 0 })

    // Only call setPeriod if it's different from current to avoid unnecessary reloads
    const currentPeriod = chart.getPeriod()
    if (!currentPeriod || currentPeriod.type !== cfg.type || currentPeriod.span !== cfg.span) {
      chart.setPeriod({ type: cfg.type, span: cfg.span })
    }
  }, [chartReady, symbol, period])

  // Switch indicator
  useEffect(() => {
    if (!chartInstanceRef.current || !chartReady) return

    const chart = chartInstanceRef.current

    try {
      const allIndicators = chart.getIndicators()
      allIndicators.forEach(indItem => {
        if (indItem.name !== 'candle') {
          chart.removeIndicator({ paneId: indItem.paneId, name: indItem.name })
        }
      })

      chart.createIndicator(indicator, false, { paneId: 'candle' })
      if (['MACD', 'RSI', 'KDJ', 'DMI', 'OBV'].includes(indicator)) {
        chart.createIndicator(indicator, true)
      }
    } catch (e) {
      console.warn('[StockChart] 切换指标失败:', e)
    }
  }, [indicator, chartReady])

  const isPositive = latestPrice ? latestPrice.change >= 0 : false
  const priceChange = latestPrice ? latestPrice.change.toFixed(2) : '0.00'
  const priceChangePercent = latestPrice ? latestPrice.changePercent : '0.00'

  const handleZoom = (direction) => {
    if (!chartInstanceRef.current) return
    const scale = direction === 'in' ? 1.2 : 0.8
    chartInstanceRef.current.zoomAtCoordinate(scale)
  }

  const handleScreenshot = () => {
    if (!chartInstanceRef.current) return
    const url = chartInstanceRef.current.getConvertPictureUrl(true, 'png', '#ffffff')
    const link = document.createElement('a')
    link.href = url
    link.download = `${name || symbol}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.png`
    link.click()
  }

  const handleFullscreen = () => {
    if (!chartRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      chartRef.current.requestFullscreen?.()
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '16px', background: '#ffffff' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', padding: '0 16px 16px 16px' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-3 pt-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 leading-tight">{name || symbol}</span>
              <span className="text-xs text-gray-400 font-mono mt-0.5">{symbol}</span>
            </div>

            {latestPrice && (
              <div className="flex items-baseline gap-3 ml-6">
                <span className={`text-3xl font-bold ${isPositive ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                  {latestPrice.close.toFixed(2)}
                </span>
                <div className={`flex items-center gap-1.5 text-sm font-medium ${isPositive ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{Number(priceChange) >= 0 ? '+' : ''}{priceChange}</span>
                  <span>({Number(priceChangePercent) >= 0 ? '+' : ''}{priceChangePercent}%)</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="截图"
              onClick={handleScreenshot}
            >
              <Camera className="w-4 h-4 text-gray-500" />
            </button>
            <button
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="全屏"
              onClick={handleFullscreen}
            >
              <Maximize2 className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-0 mb-3">
          <div className="flex items-center gap-0 bg-[#f9fafb] border border-gray-200 rounded-lg p-1">
            {PERIOD_LIST.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium transition-all rounded-md ${
                  period === p
                    ? 'bg-[#3b82f6] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {PERIOD_CONFIG[p].label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200 mx-3" />

          <div className="flex items-center gap-0 bg-[#f9fafb] border border-gray-200 rounded-lg p-1">
            {INDICATOR_NAMES.map((ind) => (
              <button
                key={ind}
                onClick={() => setIndicator(ind)}
                className={`px-3 py-1.5 text-xs font-medium transition-all rounded-md ${
                  indicator === ind
                    ? 'bg-[#3b82f6] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {ind}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200 mx-3" />

          <div className="flex items-center gap-0">
            <button
              className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              title="缩小"
              onClick={() => handleZoom('out')}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              title="放大"
              onClick={() => handleZoom('in')}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-4 text-sm text-gray-400">
            加载数据中...
          </div>
        )}

        {/* Chart */}
        <div
          ref={chartRef}
          className="rounded-lg border border-gray-200 overflow-hidden"
          style={{ height: '500px', minHeight: '500px', background: '#ffffff' }}
        />

        {/* OHLC info */}
        {latestPrice && (
          <div className="flex items-center gap-4 mt-2 px-2 text-xs">
            <span className="text-gray-400">开: <span className="text-gray-700">{latestPrice.open.toFixed(2)}</span></span>
            <span className="text-gray-400">高: <span className="text-gray-700">{latestPrice.high.toFixed(2)}</span></span>
            <span className="text-gray-400">低: <span className="text-gray-700">{latestPrice.low.toFixed(2)}</span></span>
            <span className="text-gray-400">收: <span className="text-gray-700">{latestPrice.close.toFixed(2)}</span></span>
            <span className="text-gray-400">量: <span className="text-gray-700">{(latestPrice.volume / 10000).toFixed(1)}万</span></span>
          </div>
        )}
      </div>
    </div>
  )
}

export default StockChart
