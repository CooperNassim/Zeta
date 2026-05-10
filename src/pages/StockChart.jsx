import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

export default function StockChart() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const symbol = searchParams.get('symbol') || ''
  const name = searchParams.get('name') || ''

  const [period, setPeriod] = useState('day')
  const [indicator, setIndicator] = useState('MA')
  const [data, setData] = useState([])

  // Generate mock K-line data
  useEffect(() => {
    const days = period === 'day' ? 120 : period === 'week' ? 52 : 24
    const result = []
    let basePrice = 10 + Math.random() * 20

    for (let i = 0; i < days; i++) {
      const date = new Date()
      if (period === 'day') date.setDate(date.getDate() - (days - i))
      else if (period === 'week') date.setDate(date.getDate() - (days - i) * 7)
      else date.setMonth(date.getMonth() - (days - i))

      const open = basePrice
      const change = (Math.random() - 0.48) * basePrice * 0.04
      const close = open + change
      const high = Math.max(open, close) + Math.random() * basePrice * 0.02
      const low = Math.min(open, close) - Math.random() * basePrice * 0.02
      const volume = Math.floor(Math.random() * 500000 + 100000)

      result.push({
        date: date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
        timestamp: date.getTime(),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume,
      })

      basePrice = close
    }
    setData(result)
  }, [period])

  // Calculate technical indicators
  const chartData = useMemo(() => {
    if (!data.length) return []
    const result = data.map((d, i) => ({ ...d }))

    // MA (Moving Average)
    if (indicator === 'MA' || indicator === 'BOLL') {
      const calcMA = (arr, n) => {
        return arr.map((_, i) => {
          if (i < n - 1) return null
          const slice = arr.slice(i - n + 1, i + 1)
          return slice.reduce((s, v) => s + v.close, 0) / n
        })
      }
      const ma5 = calcMA(data, 5)
      const ma10 = calcMA(data, 10)
      const ma20 = calcMA(data, 20)
      result.forEach((d, i) => {
        d.MA5 = ma5[i] ? parseFloat(ma5[i].toFixed(2)) : null
        d.MA10 = ma10[i] ? parseFloat(ma10[i].toFixed(2)) : null
        d.MA20 = ma20[i] ? parseFloat(ma20[i].toFixed(2)) : null
      })
    }

    // BOLL (Bollinger Bands)
    if (indicator === 'BOLL') {
      const n = 20
      result.forEach((d, i) => {
        if (i < n - 1) {
          d.UPPER = null; d.MID = null; d.LOWER = null
          return
        }
        const slice = data.slice(i - n + 1, i + 1).map(v => v.close)
        const mean = slice.reduce((s, v) => s + v, 0) / n
        const std = Math.sqrt(slice.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n)
        d.MID = parseFloat(mean.toFixed(2))
        d.UPPER = parseFloat((mean + 2 * std).toFixed(2))
        d.LOWER = parseFloat((mean - 2 * std).toFixed(2))
      })
    }

    return result
  }, [data, indicator])

  // Separate indicator data for sub-chart
  const indicatorData = useMemo(() => {
    if (!data.length) return []
    const result = data.map((d, i) => ({ ...d }))

    if (indicator === 'MACD') {
      const calcEMA = (arr, n) => {
        const k = 2 / (n + 1)
        const ema = [arr[0]]
        for (let i = 1; i < arr.length; i++) {
          ema.push(arr[i] * k + ema[i - 1] * (1 - k))
        }
        return ema
      }
      const closes = data.map(d => d.close)
      const ema12 = calcEMA(closes, 12)
      const ema26 = calcEMA(closes, 26)
      const diff = ema12.map((v, i) => v - ema26[i])
      const dea = calcEMA(diff, 9)
      const macd = diff.map((v, i) => (v - dea[i]) * 2)

      result.forEach((d, i) => {
        d.DIFF = parseFloat(diff[i].toFixed(3))
        d.DEA = parseFloat(dea[i].toFixed(3))
        d.MACD = parseFloat(macd[i].toFixed(3))
      })
    } else if (indicator === 'RSI') {
      const calcRSI = (arr, n) => {
        const rsi = new Array(n).fill(null)
        let gainSum = 0, lossSum = 0
        for (let i = 1; i <= n; i++) {
          const change = arr[i] - arr[i - 1]
          if (change >= 0) gainSum += change; else lossSum -= change
        }
        let avgGain = gainSum / n, avgLoss = lossSum / n
        rsi[n] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
        for (let i = n + 1; i < arr.length; i++) {
          const change = arr[i] - arr[i - 1]
          avgGain = (avgGain * (n - 1) + (change > 0 ? change : 0)) / n
          avgLoss = (avgLoss * (n - 1) + (change < 0 ? -change : 0)) / n
          rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
        }
        return rsi
      }
      const closes = data.map(d => d.close)
      const rsi6 = calcRSI(closes, 6)
      const rsi12 = calcRSI(closes, 12)
      const rsi24 = calcRSI(closes, 24)
      result.forEach((d, i) => {
        d.RSI6 = rsi6[i] !== null ? parseFloat(rsi6[i].toFixed(2)) : null
        d.RSI12 = rsi12[i] !== null ? parseFloat(rsi12[i].toFixed(2)) : null
        d.RSI24 = rsi24[i] !== null ? parseFloat(rsi24[i].toFixed(2)) : null
      })
    }

    return result
  }, [data, indicator])

  const latestPrice = data.length > 0 ? data[data.length - 1] : null
  const isPositive = latestPrice ? latestPrice.close >= latestPrice.open : false
  const priceChange = latestPrice ? (latestPrice.close - latestPrice.open).toFixed(2) : '0.00'
  const priceChangePercent = latestPrice ? (((latestPrice.close - latestPrice.open) / latestPrice.open) * 100).toFixed(2) : '0.00'

  // Custom candlestick bar renderer
  const CandleBar = (props) => {
    const { x, y, width, height, payload } = props
    if (!payload) return null
    const { open, close } = payload
    const isUp = close >= open
    const color = isUp ? '#ef4444' : '#22c55e'
    const candleTop = Math.min(y, y + height * ((open - payload.low) / (payload.high - payload.low || 1)))
    const candleBottom = Math.max(y + height, y + height * ((close - payload.low) / (payload.high - payload.low || 1)))
    const wickTop = y
    const wickBottom = y + height

    return (
      <g>
        {/* Wick */}
        <line x1={x + width / 2} y1={wickTop} x2={x + width / 2} y2={wickBottom} stroke={color} strokeWidth={1} />
        {/* Body */}
        <rect x={x + 1} y={candleTop} width={Math.max(width - 2, 2)} height={Math.max(candleBottom - candleTop, 1)} fill={color} />
      </g>
    )
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null
    const d = payload[0].payload
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
        <div className="font-semibold text-gray-900 mb-1">{d.date}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <span className="text-gray-500">开:</span><span>{d.open}</span>
          <span className="text-gray-500">高:</span><span>{d.high}</span>
          <span className="text-gray-500">低:</span><span>{d.low}</span>
          <span className="text-gray-500">收:</span><span>{d.close}</span>
          <span className="text-gray-500">量:</span><span>{(d.volume / 10000).toFixed(1)}万</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px', background: '#f8fafc' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', padding: '16px' }}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">{name}</h2>
            <span className="text-sm text-gray-500 font-mono">{symbol}</span>
          </div>
          {latestPrice && (
            <div className="flex items-center gap-3 ml-4">
              <span className={`text-2xl font-bold ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
                {latestPrice.close.toFixed(2)}
              </span>
              <span className={`text-sm font-medium flex items-center gap-1 ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isPositive ? '+' : ''}{priceChange} ({isPositive ? '+' : ''}{priceChangePercent}%)
              </span>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
            {[['day', '日线'], ['week', '周线'], ['month', '月线']].map(([key, label]) => (
              <button key={key} onClick={() => setPeriod(key)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${period === key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
            {['MA', 'MACD', 'RSI', 'BOLL'].map((ind) => (
              <button key={ind} onClick={() => setIndicator(ind)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${indicator === ind ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {ind}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden p-4" style={{ minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
              <YAxis yAxisId="price" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={['dataMin', 'dataMax']} />
              <Tooltip content={<CustomTooltip />} />

              {/* Candlestick */}
              <Bar yAxisId="price" dataKey="close" shape={<CandleBar />} barSize={8} />

              {/* MA Lines */}
              {indicator === 'MA' && (
                <>
                  <Line yAxisId="price" type="monotone" dataKey="MA5" stroke="#f59e0b" dot={false} strokeWidth={1.5} />
                  <Line yAxisId="price" type="monotone" dataKey="MA10" stroke="#3b82f6" dot={false} strokeWidth={1.5} />
                  <Line yAxisId="price" type="monotone" dataKey="MA20" stroke="#8b5cf6" dot={false} strokeWidth={1.5} />
                </>
              )}

              {/* BOLL Lines */}
              {indicator === 'BOLL' && (
                <>
                  <Line yAxisId="price" type="monotone" dataKey="UPPER" stroke="#f97316" dot={false} strokeWidth={1} strokeDasharray="4 2" />
                  <Line yAxisId="price" type="monotone" dataKey="MID" stroke="#8b5cf6" dot={false} strokeWidth={1.5} />
                  <Line yAxisId="price" type="monotone" dataKey="LOWER" stroke="#22c55e" dot={false} strokeWidth={1} strokeDasharray="4 2" />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>

          {/* Sub indicator chart */}
          {(indicator === 'MACD' || indicator === 'RSI') && (
            <div className="h-40 mt-4 border-t border-gray-100 pt-4">
              <div className="text-xs text-gray-400 mb-2 font-medium">{indicator}</div>
              <ResponsiveContainer width="100%" height="100%">
                {indicator === 'MACD' ? (
                  <ComposedChart data={indicatorData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <ReferenceLine y={0} stroke="#9ca3af" />
                    <Bar dataKey="MACD" fill={({ payload }) => payload.MACD >= 0 ? '#ef4444' : '#22c55e'} barSize={6} />
                    <Line type="monotone" dataKey="DIFF" stroke="#f59e0b" dot={false} strokeWidth={1.5} />
                    <Line type="monotone" dataKey="DEA" stroke="#3b82f6" dot={false} strokeWidth={1.5} />
                  </ComposedChart>
                ) : (
                  <ComposedChart data={indicatorData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
                    <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="RSI6" stroke="#f59e0b" dot={false} strokeWidth={1.5} />
                    <Line type="monotone" dataKey="RSI12" stroke="#3b82f6" dot={false} strokeWidth={1.5} />
                    <Line type="monotone" dataKey="RSI24" stroke="#8b5cf6" dot={false} strokeWidth={1.5} />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
