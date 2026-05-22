import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown, Camera, Maximize2, Minus, Plus, Settings } from 'lucide-react'
import { init, dispose, registerIndicator } from 'klinecharts'
import IndicatorSettingsModal, { applySavedIndicatorStyles } from '../components/IndicatorSettingsModal'

const PERIOD_CONFIG = {
  'D': { type: 'day', span: 1, label: '日线' },
  'W': { type: 'week', span: 1, label: '周线' },
  'M': { type: 'month', span: 1, label: '月线' },
}

const MAIN_INDICATORS = ['MA', 'EMA', 'BOLL']
const SUB_INDICATORS = ['MACD', 'RSI', 'KDJ', 'DMI', 'OBV', 'FI']
const ALL_INDICATORS = [...MAIN_INDICATORS, ...SUB_INDICATORS]
const PERIOD_LIST = Object.keys(PERIOD_CONFIG)

// 注册自定义 FI（Force Index，强力指数）指标
registerIndicator({
  name: 'FI',
  shortName: 'FI',
  series: 'normal',
  calcParams: [2, 13],
  precision: 0,
  shouldFormatBigNumber: true,
  figures: [
    { key: 'fi2', title: 'FI2: ', type: 'line' },
    { key: 'fi13', title: 'FI13: ', type: 'line' },
    {
      key: 'fiDiff',
      title: '差值: ',
      type: 'bar',
      baseValue: 0,
      styles: ({ data }) => {
        const current = data.current
        const currentDiff = current != null && current.fiDiff != null ? current.fiDiff : 0
        const color = currentDiff >= 0 ? '#22c55e' : '#ef4444'
        return { color, style: 'fill' }
      }
    }
  ],
  regenerateFigures: (params) => {
    return params.flatMap((p, i) => {
      const lineFigures = { key: `fi${p}`, title: `FI${p}: `, type: 'line' }
      return i === params.length - 1 ? [lineFigures, {
        key: 'fiDiff',
        title: '差值: ',
        type: 'bar',
        baseValue: 0,
        styles: ({ data }) => {
          const current = data.current
          const currentDiff = current != null && current.fiDiff != null ? current.fiDiff : 0
          const color = currentDiff >= 0 ? '#22c55e' : '#ef4444'
          return { color, style: 'fill' }
        }
      }] : [lineFigures]
    })
  },
  calc: (dataList, indicator) => {
    const params = indicator.calcParams
    const fiRawValues = []
    const fiEmaValues = params.map(() => [])

    return dataList.map((kLineData, i) => {
      const result = {}
      const volume = kLineData.volume || 0
      const close = kLineData.close

      if (i > 0) {
        const prevClose = dataList[i - 1].close
        fiRawValues[i] = (close - prevClose) * volume
      } else {
        fiRawValues[i] = 0
      }

      params.forEach((p, idx) => {
        if (i >= p - 1) {
          if (i === p - 1) {
            let sum = 0
            for (let j = 0; j <= i; j++) {
              sum += fiRawValues[j]
            }
            fiEmaValues[idx][0] = sum / p
          } else {
            fiEmaValues[idx][0] = (2 * fiRawValues[i] + (p - 1) * fiEmaValues[idx][0]) / (p + 1)
          }
          result[`fi${p}`] = fiEmaValues[idx][0]
        }
      })

      if (result.fi2 != null && result.fi13 != null) {
        result.fiDiff = result.fi2 - result.fi13
      }

      return result
    })
  }
})

function StockChart() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const symbol = searchParams.get('symbol') || ''
  const name = searchParams.get('name') || ''

  const chartRef = useRef(null)
  const chartInstanceRef = useRef(null)
  const [period, setPeriod] = useState('D')
  const [activeIndicators, setActiveIndicators] = useState(['MA'])
  const [showIndicatorPicker, setShowIndicatorPicker] = useState(false)
  const [latestPrice, setLatestPrice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chartReady, setChartReady] = useState(false)
  const [hoverKline, setHoverKline] = useState(null)
  const [tooltipX, setTooltipX] = useState(null)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const listenersRef = useRef(null)

  const periodRef = useRef(period)
  const symbolRef = useRef(symbol)
  const dataRef = useRef([])
  const allDataRef = useRef([])
  const activeIndicatorsRef = useRef(activeIndicators)
  const dataLoadedRef = useRef(false)
  const loadingRef = useRef(false)
  const chartDataLoadedRef = useRef(false)
  const dataReturnedRef = useRef(false)
  const getBarsReturnedRef = useRef(false)

  periodRef.current = period
  symbolRef.current = symbol
  activeIndicatorsRef.current = activeIndicators

  // 获取K线数据
  // 注意：不传 limit 参数，后端会返回数据库中该股票的全部历史数据
  const fetchData = useCallback(async (targetPeriod) => {
    const currentSymbol = symbolRef.current
    if (!currentSymbol) return []
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    try {
      console.log('[StockChart] fetchData 请求:', `${backendUrl}/api/market/kline?provider=eastmoney&symbol=${currentSymbol}&period=${targetPeriod}`)
      const klineRes = await fetch(`${backendUrl}/api/market/kline?provider=eastmoney&symbol=${currentSymbol}&period=${targetPeriod}`)
      const klineResult = await klineRes.json()
      console.log('[StockChart] API 响应:', klineResult.success, '数据条数:', klineResult.data?.length, 'source:', klineResult.source)
      if (klineResult.data?.length > 0) {
        console.log('[StockChart] 第一条数据:', JSON.stringify(klineResult.data[0]))
      }
      if (!klineResult.success || !klineResult.data || klineResult.data.length === 0) {
        console.log('[StockChart] API 返回无数据')
        return []
      }

      const klineData = klineResult.data.map((item, index, arr) => {
        const dateStr = item.date || item.timestamp
        const ts = typeof dateStr === 'number' 
          ? dateStr 
          : new Date(dateStr).getTime()
        
        if (!ts || isNaN(ts)) return null
        
        const prevItem = index > 0 ? arr[index - 1] : null
        const prevClose = prevItem ? parseFloat(prevItem.close) : parseFloat(item.open)
        return {
          timestamp: ts,
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close),
          volume: parseFloat(item.volume || 0),
          turnover: parseFloat(item.amount || 0),
          prevClose,
        }
      }).filter(Boolean)

      // 前端去重保护：按 timestamp 去重，防止数据库中同一日期有多条记录
      const dedupedMap = new Map()
      klineData.forEach(k => {
        if (!dedupedMap.has(k.timestamp) || k.volume > dedupedMap.get(k.timestamp).volume) {
          dedupedMap.set(k.timestamp, k)
        }
      })
      const dedupedKlineData = Array.from(dedupedMap.values()).sort((a, b) => a.timestamp - b.timestamp)
      console.log('[StockChart] 去重后数据条数:', dedupedKlineData.length, '（原:', klineData.length, '）')

      try {
        const indicatorRes = await fetch(`${backendUrl}/api/market/indicators?symbol=${currentSymbol}&period=${targetPeriod}`)
        const indicatorResult = await indicatorRes.json()
        if (indicatorResult.success && indicatorResult.data && indicatorResult.data.length > 0) {
          const indicatorMap = new Map()
          indicatorResult.data.forEach(ind => { indicatorMap.set(ind.trade_date, ind) })
          dedupedKlineData.forEach(kline => {
            const date = new Date(kline.timestamp)
            const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
            const ind = indicatorMap.get(dateStr)
            if (ind) {
              if (ind.ma5) kline.ma5 = parseFloat(ind.ma5)
              if (ind.ma10) kline.ma10 = parseFloat(ind.ma10)
              if (ind.ma20) kline.ma20 = parseFloat(ind.ma20)
              if (ind.ma30) kline.ma30 = parseFloat(ind.ma30)
              if (ind.ma60) kline.ma60 = parseFloat(ind.ma60)
              if (ind.boll_mid) kline.bollMid = parseFloat(ind.boll_mid)
              if (ind.boll_upper) kline.bollUpper = parseFloat(ind.boll_upper)
              if (ind.boll_lower) kline.bollLower = parseFloat(ind.boll_lower)
              if (ind.macd_dif) kline.macdDif = parseFloat(ind.macd_dif)
              if (ind.macd_dea) kline.macdDea = parseFloat(ind.macd_dea)
              if (ind.macd_hist) kline.macdHist = parseFloat(ind.macd_hist)
              if (ind.rsi6) kline.rsi6 = parseFloat(ind.rsi6)
              if (ind.rsi12) kline.rsi12 = parseFloat(ind.rsi12)
              if (ind.rsi24) kline.rsi24 = parseFloat(ind.rsi24)
              if (ind.kdj_k) kline.kdjK = parseFloat(ind.kdj_k)
              if (ind.kdj_d) kline.kdjD = parseFloat(ind.kdj_d)
              if (ind.kdj_j) kline.kdjJ = parseFloat(ind.kdj_j)
            }
          })
        }
      } catch (e) {
        console.warn('[StockChart] 获取预计算指标失败:', e)
      }
      return dedupedKlineData
    } catch (error) {
      console.error('[StockChart] 获取数据失败:', error)
      return []
    }
  }, [])

  const updateLatestPrice = useCallback((data) => {
    if (data.length === 0) return
    const last = data[data.length - 1]
    const prevClose = data.length > 1 ? data[data.length - 2].close : last.open
    const change = last.close - prevClose
    const changePercent = prevClose !== 0 ? ((change / prevClose) * 100).toFixed(2) : '0.00'
    setLatestPrice({
      open: last.open, high: last.high, low: last.low, close: last.close,
      volume: last.volume, change, changePercent,
    })
  }, [])

  // 统一的图表初始化和监听器设置函数
  const setupChart = useCallback((mainInds, shouldLoadData = true) => {
    if (!chartRef.current) return null

    // 销毁旧实例
    if (chartInstanceRef.current) {
      try {
        dispose(chartRef.current)
      } catch (e) { /* ignore */ }
    }
    if (listenersRef.current) {
      const { container, crosshairHandler, mouseLeaveHandler } = listenersRef.current
      try {
        chartInstanceRef.current?.unsubscribeAction('onCrosshairChange', crosshairHandler)
      } catch (e) { /* ignore */ }
      container.removeEventListener('mouseleave', mouseLeaveHandler)
    }

    const chart = init(chartRef.current, {
      locale: 'zh-CN',
      timezone: 'Asia/Shanghai',
      layout: [{ type: 'candle', content: mainInds, options: { id: 'candle', axis: { position: 'right' } } }],
      styles: {
        grid: { horizontal: { show: true, color: '#f3f4f6' }, vertical: { show: true, color: '#f3f4f6' } },
        candle: {
          type: 'candle_solid',
          bar: { upColor: '#ef4444', downColor: '#22c55e', noChangeColor: '#888888', upBorderColor: '#ef4444', downBorderColor: '#22c55e', noChangeBorderColor: '#888888', upWickColor: '#ef4444', downWickColor: '#22c55e', noChangeWickColor: '#888888' },
          priceMark: { high: { show: false }, low: { show: false }, last: { show: true, upColor: '#ef4444', downColor: '#22c55e', text: { show: true, size: 10 } } },
          tooltip: { showRule: 'none' },
          axis: { position: 'right' },
        },
        indicator: { ohlc: { show: false, upColor: '#ef4444', downColor: '#22c55e', noChangeColor: '#888888' } },
        yAxis: { show: true, width: 40, fixedWidth: 40, tickText: { show: true, size: 9, color: '#6b7280' }, tickLine: { show: false } },
        xAxis: { show: true, height: 24, tickText: { show: true, size: 9, color: '#6b7280' }, tickLine: { show: false } },
      },
    })

    chart.setMaxOffsetLeftDistance(0)
    chart.setOffsetRightDistance(0)

    // 清除旧数据和加载标志
    dataRef.current = []
    allDataRef.current = []
    dataLoadedRef.current = false
    loadingRef.current = false
    chartDataLoadedRef.current = false

    chartInstanceRef.current = chart
    const container = chartRef.current

    // 设置 symbol 和 period
    const currentSymbol = symbolRef.current
    if (currentSymbol) {
      chart.setSymbol({ ticker: currentSymbol, pricePrecision: 2, volumePrecision: 0 })
    }
    const cfg = PERIOD_CONFIG[periodRef.current] || PERIOD_CONFIG['D']
    chart.setPeriod({ type: cfg.type, span: cfg.span })

    // 使用 setDataLoader + getBars 方式加载数据
    // 关键：使用 getBarsReturnedRef 确保每个股票/周期组合只返回一次数据，防止重复
    chart.setDataLoader({
      getBars: async (params) => {
        const { callback, from, to } = params

        // 首次调用时异步加载数据
        if (!dataLoadedRef.current && !loadingRef.current) {
          loadingRef.current = true
          setLoading(true)

          const currentPeriod = periodRef.current
          const currentSymbol = symbolRef.current
          console.log('[StockChart] getBars 首次加载, symbol:', currentSymbol, 'period:', currentPeriod)
          const data = await fetchData(currentPeriod)
          console.log('[StockChart] fetchData 返回数据条数:', data.length)

          if (data.length > 0) {
            // 添加涨跌幅等计算字段
            const barsWithChanges = data.map((item, index, arr) => {
              const prevItem = index > 0 ? arr[index - 1] : null
              const prevClose = prevItem ? prevItem.close : item.open
              const change = item.close - prevClose
              const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0
              const amplitude = prevClose !== 0 ? ((item.high - item.low) / prevClose) * 100 : 0
              return { ...item, change, changePercent, amplitude }
            })

            allDataRef.current = barsWithChanges
            dataRef.current = barsWithChanges
            dataLoadedRef.current = true
            getBarsReturnedRef.current = false
            updateLatestPrice(barsWithChanges)
          }
          loadingRef.current = false
          setLoading(false)
        }

        // 数据未加载完成，返回空
        if (!dataLoadedRef.current) {
          callback([], true)
          return
        }

        // 防止 klinecharts 多次调用 getBars 导致数据重复
        if (getBarsReturnedRef.current) {
          callback([], true)
          return
        }

        const allBars = allDataRef.current
        if (allBars.length === 0) {
          callback([], true)
          return
        }

        // from/to 是数据索引（dataIndex）
        let start = from ?? 0
        let end = to ?? allBars.length - 1

        // 确保索引范围有效
        start = Math.max(0, start)
        end = Math.min(allBars.length - 1, end)

        if (start > end) {
          callback([], true)
          return
        }

        const slicedBars = allBars.slice(start, end + 1)
        const isLast = end >= allBars.length - 1

        getBarsReturnedRef.current = true
        console.log('[StockChart] getBars callback, symbol:', symbolRef.current, '索引:', start, '-', end, '返回:', slicedBars.length, '条, isLast:', isLast)
        callback(slicedBars, isLast)
      },
    })

    // 十字光标监听
    const handleCrosshairChange = (data) => {
      if (dataRef.current.length === 0 || !data) {
        setHoverKline(null)
        const last = dataRef.current[dataRef.current.length - 1]
        if (last) {
          const prevClose = dataRef.current.length > 1 ? dataRef.current[dataRef.current.length - 2].close : last.open
          const change = last.close - prevClose
          const changePercent = prevClose !== 0 ? ((change / prevClose) * 100).toFixed(2) : '0.00'
          setLatestPrice({
            open: last.open, high: last.high, low: last.low, close: last.close,
            volume: last.volume, change, changePercent,
          })
        }
        return
      }
      const paneId = data.paneId || 'candle'
      setTooltipX(data.x)
      const points = chart.convertFromPixel([{ x: data.x, y: data.y }], { paneId })
      if (!Array.isArray(points) || points.length === 0) { setHoverKline(null); return }
      const point = points[0]
      if (!point || typeof point.dataIndex !== 'number' || point.dataIndex < 0) { setHoverKline(null); return }
      const kline = dataRef.current[point.dataIndex]
      if (!kline) { setHoverKline(null); return }
      const prevClose = kline.prevClose != null ? kline.prevClose : kline.open
      const change = kline.close - prevClose
      const changePercentNum = prevClose !== 0 ? (change / prevClose) * 100 : 0
      const amplitudeNum = prevClose !== 0 ? ((kline.high - kline.low) / prevClose) * 100 : 0
      setLatestPrice({
        open: kline.open, high: kline.high, low: kline.low, close: kline.close,
        volume: kline.volume, change, changePercent: changePercentNum.toFixed(2),
      })
      setHoverKline({
        timestamp: kline.timestamp, open: kline.open, high: kline.high, low: kline.low,
        close: kline.close, change, changePercent: changePercentNum, amplitude: amplitudeNum,
        volume: kline.volume, turnover: kline.turnover,
      })
    }

    const handleMouseLeave = () => {
      const last = dataRef.current[dataRef.current.length - 1]
      if (last) {
        const prevClose = dataRef.current.length > 1 ? dataRef.current[dataRef.current.length - 2].close : last.open
        const change = last.close - prevClose
        const changePercent = prevClose !== 0 ? ((change / prevClose) * 100).toFixed(2) : '0.00'
        setLatestPrice({
          open: last.open, high: last.high, low: last.low, close: last.close,
          volume: last.volume, change, changePercent,
        })
      }
    }

    try {
      chart.subscribeAction('onCrosshairChange', handleCrosshairChange)
    } catch (e) { console.warn('[StockChart] subscribeAction failed:', e) }
    container.addEventListener('mouseleave', handleMouseLeave)

    listenersRef.current = { container, crosshairHandler: handleCrosshairChange, mouseLeaveHandler: handleMouseLeave }
    setChartReady(true)

    setTimeout(() => {
      applySavedIndicatorStyles(chart)
    }, 100)

    return chart
  }, [fetchData, updateLatestPrice])

  // 初始图表创建
  useEffect(() => {
    if (!chartRef.current) return
    const chart = setupChart(['MA'])
    return () => {
      try { dispose(chartRef.current) } catch (e) { /* ignore */ }
      if (listenersRef.current) {
        const { container, crosshairHandler } = listenersRef.current
        try { chartInstanceRef.current?.unsubscribeAction('onCrosshairChange', crosshairHandler) } catch (e) { /* ignore */ }
        container.removeEventListener('mouseleave', listenersRef.current.mouseLeaveHandler)
      }
    }
  }, [setupChart])

  const formatVolume = (value) => {
    if (value == null) return '0'
    if (value >= 100000000) return (value / 100000000).toFixed(2) + '亿'
    if (value >= 10000) return (value / 10000).toFixed(2) + '万'
    return value.toFixed(2)
  }

  const formatNum = (value) => {
    if (value == null) return '--'
    return value.toFixed(2)
  }

  // 切换股票或周期时重新加载数据
  useEffect(() => {
    if (!chartReady || !chartInstanceRef.current || !symbol) return

    // 重置所有标志，触发 getBars 重新加载数据
    dataRef.current = []
    allDataRef.current = []
    dataLoadedRef.current = false
    loadingRef.current = false
    getBarsReturnedRef.current = false
    setLoading(true)

    // 更新 chart 的 symbol 和 period，会触发 klinecharts 内部重新调用 getBars
    const chart = chartInstanceRef.current
    chart.setSymbol({ ticker: symbol, pricePrecision: 2, volumePrecision: 0 })
    const cfg = PERIOD_CONFIG[period] || PERIOD_CONFIG['D']
    chart.setPeriod({ type: cfg.type, span: cfg.span })
  }, [chartReady, symbol, period])

  // 同步指标到图表
  const syncIndicatorsToChart = useCallback(() => {
    if (!chartInstanceRef.current || !chartReady) return
    const chart = chartInstanceRef.current
    try {
      const current = activeIndicatorsRef.current
      
      // 1. 处理主图指标（MA/EMA/BOLL）- 变化时销毁重建，通过 layout.content 传入
      const currentMainInds = chart.getIndicators()
        .filter(ind => ind.paneId === 'candle' && ind.name !== 'candle')
        .map(ind => ind.name)
      const targetMainInds = current.filter(name => MAIN_INDICATORS.includes(name))
      const mainChanged = currentMainInds.length !== targetMainInds.length || 
                          currentMainInds.some(name => !targetMainInds.includes(name))
      
      if (mainChanged) {
        const mainIndsToUse = targetMainInds.length > 0 ? targetMainInds : ['MA']
        setupChart(mainIndsToUse)
        // 重建后恢复副图指标
        setTimeout(() => {
          const targetSubInds = current.filter(name => SUB_INDICATORS.includes(name))
          targetSubInds.forEach(name => {
            chartInstanceRef.current?.createIndicator(name, true)
          })
          // 应用保存的指标样式
          applySavedIndicatorStyles(chartInstanceRef.current)
        }, 300)
        return
      }

      // 2. 处理副图指标（MACD/RSI/KDJ/DMI/OBV/FI）- 各自独立面板
      const allIndicators = chart.getIndicators()
      const currentSubPanes = allIndicators
        .filter(ind => ind.paneId !== 'candle' && ind.name !== 'candle')
        .map(ind => ({ name: ind.name, paneId: ind.paneId }))
      const targetSubInds = current.filter(name => SUB_INDICATORS.includes(name))
      
      currentSubPanes
        .filter(item => !targetSubInds.includes(item.name))
        .forEach(item => {
          chart.removeIndicator({ paneId: item.paneId, name: item.name })
        })
      
      targetSubInds.filter(name => !currentSubPanes.some(item => item.name === name)).forEach(name => {
        chart.createIndicator(name, true)
      })

      // 应用保存的指标样式
      setTimeout(() => {
        applySavedIndicatorStyles(chart)
      }, 100)
    } catch (e) {
      console.warn('[StockChart] 同步指标失败:', e)
    }
  }, [chartReady, setupChart])

  // 当选中指标变化时同步到图表
  useEffect(() => {
    syncIndicatorsToChart()
  }, [activeIndicators, chartReady, syncIndicatorsToChart])

  const toggleIndicator = (name) => {
    setActiveIndicators(prev =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name]
    )
  }

  const isPositive = latestPrice ? latestPrice.change >= 0 : false
  const priceChange = latestPrice ? latestPrice.change.toFixed(2) : '0.00'
  const priceChangePercent = latestPrice ? latestPrice.changePercent : '0.00'

  const handleZoom = (direction) => {
    if (!chartInstanceRef.current) return
    chartInstanceRef.current.zoomAtCoordinate(direction === 'in' ? 1.2 : 0.8)
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
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', background: '#ffffff' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', padding: '0 16px 16px 16px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '10px', marginTop: '10px' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 leading-tight">{name || symbol}</span>
              <span className="text-gray-400 font-mono mt-0.5" style={{ fontSize: '14px' }}>{symbol}</span>
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
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="截图" onClick={handleScreenshot}>
              <Camera className="w-4 h-4 text-gray-500" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="全屏" onClick={handleFullscreen}>
              <Maximize2 className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-0 mb-3" style={{ flexWrap: 'wrap' }}>
          <div className="flex items-center gap-0 bg-[#f9fafb] border border-gray-200 rounded-lg p-1">
            {PERIOD_LIST.map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-xs font-medium transition-all rounded-md ${period === p ? 'bg-[#3b82f6] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
                {PERIOD_CONFIG[p].label}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-gray-200 mx-3" />
          <div className="flex items-center gap-1 flex-wrap">
            {activeIndicators.map(ind => (
              <button
                key={ind}
                onClick={() => toggleIndicator(ind)}
                className="px-3 py-1.5 text-xs font-medium transition-all rounded-md bg-[#3b82f6] text-white shadow-sm"
              >
                {ind}
              </button>
            ))}
            <button
              onClick={() => setShowIndicatorPicker(!showIndicatorPicker)}
              className="px-2 py-1.5 text-xs font-medium rounded-md bg-[#f9fafb] border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              title="添加指标"
            >
              +
            </button>
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="p-1.5 rounded-md hover:bg-gray-100 hover:text-gray-700 text-gray-500 transition-colors"
              title="指标样式设置"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="w-px h-5 bg-gray-200 mx-3" />
          <div className="flex items-center gap-0">
            <button className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700" title="缩小" onClick={() => handleZoom('out')}>
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700" title="放大" onClick={() => handleZoom('in')}>
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {showIndicatorPicker && (
          <div className="mb-3 bg-[#f9fafb] border border-gray-200 rounded-lg p-3" style={{ position: 'relative', zIndex: 20 }}>
            <div className="flex items-center gap-8">
              <div>
                <div className="text-xs text-gray-400 mb-2 font-medium">主图指标（叠加）</div>
                <div className="flex gap-2">
                  {MAIN_INDICATORS.map(ind => (
                    <button
                      key={ind}
                      onClick={() => toggleIndicator(ind)}
                      className={`px-3 py-1.5 text-xs font-medium transition-all rounded-md ${activeIndicators.includes(ind) ? 'bg-[#3b82f6] text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-2 font-medium">副图指标（独立面板）</div>
                <div className="flex gap-2 flex-wrap">
                  {SUB_INDICATORS.map(ind => (
                    <button
                      key={ind}
                      onClick={() => toggleIndicator(ind)}
                      className={`px-3 py-1.5 text-xs font-medium transition-all rounded-md ${activeIndicators.includes(ind) ? 'bg-[#3b82f6] text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && <div className="flex items-center justify-center py-4 text-sm text-gray-400">加载数据中...</div>}

        <div
          ref={chartRef}
          className="rounded-lg border border-gray-200 relative"
          style={{ height: '500px', minHeight: '500px', background: '#ffffff' }}
        >
          {hoverKline && (
            <div className="absolute z-10 pointer-events-none rounded-lg px-3 py-2 text-xs font-mono" style={{ top: 12, left: tooltipX != null && tooltipX > (chartRef.current?.offsetWidth || 0) / 2 ? 'auto' : '16px', right: tooltipX != null && tooltipX > (chartRef.current?.offsetWidth || 0) / 2 ? '52px' : 'auto', background: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', minWidth: '110px' }}>
              <div className="space-y-0.5">
                <div className="flex justify-between"><span className="text-gray-400">时间</span><span className="text-gray-700">{(() => { const d = new Date(hoverKline.timestamp); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">开</span><span className="text-gray-700">{hoverKline.open.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">高</span><span className="text-gray-700">{hoverKline.high.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">低</span><span className="text-gray-700">{hoverKline.low.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">收</span><span className="text-gray-700">{hoverKline.close.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">涨跌</span><span className={hoverKline.change >= 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}>{hoverKline.change >= 0 ? '+' : ''}{hoverKline.change.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">涨跌幅</span><span className={hoverKline.changePercent >= 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}>{hoverKline.changePercent >= 0 ? '+' : ''}{hoverKline.changePercent.toFixed(2)}%</span></div>
                <div className="flex justify-between"><span className="text-gray-400">振幅</span><span className="text-gray-700">{hoverKline.amplitude.toFixed(2)}%</span></div>
                <div className="flex justify-between"><span className="text-gray-400">成交量</span><span className="text-gray-700">{(hoverKline.volume / 10000).toFixed(1)}万</span></div>
                <div className="flex justify-between"><span className="text-gray-400">成交额</span><span className="text-gray-700">{(hoverKline.turnover / 100000000).toFixed(2)}亿</span></div>
              </div>
            </div>
          )}
        </div>

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

      <IndicatorSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        activeIndicators={activeIndicators}
        chartInstance={chartInstanceRef.current}
      />
    </div>
  )
}

export default StockChart
