import React, { useState } from 'react'
import { Play, Save, Settings } from 'lucide-react'
import useStore from '../store/useStore'
import { useToast } from '../contexts/ToastContext'
import { BacktestEngine } from '../utils/backtest'
import ConfigPanel from '../components/backtest/ConfigPanel'
import ResultPanel from '../components/backtest/ResultPanel'

const BacktestSystem = () => {
  const showToast = useToast()
  const {
    backtestConfigs,
    currentBacktestConfig,
    backtestStatus,
    backtestProgress,
    currentBacktestResult,
    setCurrentBacktestConfig,
    setCurrentBacktestResult,
    runBacktest,
    setBacktestStatus,
    setBacktestProgress,
    addBacktestConfig,
    addBacktestResult,
    getStockKlineData,
  } = useStore()

  const [config, setConfig] = useState({
    name: '',
    description: '',
    stockCodes: [],
    startDate: '',
    endDate: '',
    indicators: [],
    buyConditions: { logic: 'AND', conditions: [] },
    sellConditions: { logic: 'AND', conditions: [] },
    stopLoss: null,
    takeProfit: null,
    positionSizing: { mode: 'FIXED_AMOUNT', params: { amount: 10000 } },
    initialCapital: 100000,
    commissionRate: 0.0003,
  })

  const [showSavedConfigs, setShowSavedConfigs] = useState(false)

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const handleRunBacktest = async () => {
    if (!config.stockCodes || config.stockCodes.length === 0) {
      showToast('请选择至少一只股票')
      return
    }

    if (!config.startDate || !config.endDate) {
      showToast('请选择回测时间范围')
      return
    }

    setBacktestStatus('running')
    setBacktestProgress(0)
    showToast('开始回测...')

    try {
      const engine = new BacktestEngine()
      const allResults = {}
      let firstSuccessResult = null

      for (let i = 0; i < config.stockCodes.length; i++) {
        const code = config.stockCodes[i]
        const klineData = getStockKlineData(code)

        if (!klineData || klineData.length === 0) {
          allResults[code] = { success: false, error: '无K线数据' }
          continue
        }

        const filteredKline = klineData.filter(d => {
          const date = new Date(d.date)
          const start = new Date(config.startDate)
          const end = new Date(config.endDate)
          return date >= start && date <= end
        })

        if (filteredKline.length < 30) {
          allResults[code] = { success: false, error: '数据不足' }
          continue
        }

        console.log(`[Backtest] 开始回测 ${code}, 数据量: ${filteredKline.length}`)
        const result = await engine.run(filteredKline, config)
        allResults[code] = result

        if (result.success && !firstSuccessResult) {
          firstSuccessResult = { ...result, stockCode: code }
        }

        setBacktestProgress(((i + 1) / config.stockCodes.length) * 100)
      }

      if (firstSuccessResult) {
        setCurrentBacktestResult(firstSuccessResult)
        setBacktestStatus('completed')
        setBacktestProgress(100)
        showToast(`回测完成 - ${config.stockCodes.length}只股票`)
      } else {
        setBacktestStatus('error')
        setBacktestProgress(0)
        const errors = Object.entries(allResults)
          .filter(([_, r]) => !r.success)
          .map(([code, r]) => `${code}: ${r.error}`)
          .join(', ')
        showToast(`回测失败: ${errors}`)
        console.error('[Backtest] 所有股票回测失败:', allResults)
      }
    } catch (error) {
      setBacktestStatus('error')
      setBacktestProgress(0)
      showToast(`回测失败: ${error.message}`)
      console.error('[Backtest] 回测异常:', error)
    }
  }

  const handleSaveConfig = async () => {
    if (!config.name) {
      showToast('请输入回测名称')
      return
    }

    try {
      await addBacktestConfig(config)
      showToast('配置保存成功')
    } catch (error) {
      showToast(`保存失败: ${error.message}`)
    }
  }

  const handleLoadConfig = (savedConfig) => {
    setConfig(savedConfig)
    setCurrentBacktestConfig(savedConfig)
    setShowSavedConfigs(false)
    showToast('已加载配置')
  }

  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
        <ConfigPanel
          config={config}
          onConfigChange={handleConfigChange}
          onRunBacktest={handleRunBacktest}
          onSaveConfig={handleSaveConfig}
          onLoadConfig={handleLoadConfig}
          isRunning={backtestStatus === 'running'}
          progress={backtestProgress}
          savedConfigs={backtestConfigs}
          showSavedConfigs={showSavedConfigs}
          setShowSavedConfigs={setShowSavedConfigs}
        />
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        <ResultPanel
          status={backtestStatus}
          progress={backtestProgress}
          result={currentBacktestResult}
          config={config}
        />
      </div>
    </div>
  )
}

export default BacktestSystem
