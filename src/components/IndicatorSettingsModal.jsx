import React, { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import Modal from './Modal'

const INDICATOR_FIELDS = {
  MA: [
    { key: 'ma5', label: 'MA5', defaultColor: '#f59e0b', defaultSize: 1 },
    { key: 'ma10', label: 'MA10', defaultColor: '#3b82f6', defaultSize: 1 },
    { key: 'ma20', label: 'MA20', defaultColor: '#ef4444', defaultSize: 1 },
    { key: 'ma30', label: 'MA30', defaultColor: '#8b5cf6', defaultSize: 1 },
    { key: 'ma60', label: 'MA60', defaultColor: '#10b981', defaultSize: 1 },
  ],
  EMA: [
    { key: 'ema5', label: 'EMA5', defaultColor: '#f59e0b', defaultSize: 1 },
    { key: 'ema10', label: 'EMA10', defaultColor: '#3b82f6', defaultSize: 1 },
    { key: 'ema20', label: 'EMA20', defaultColor: '#ef4444', defaultSize: 1 },
    { key: 'ema30', label: 'EMA30', defaultColor: '#8b5cf6', defaultSize: 1 },
    { key: 'ema60', label: 'EMA60', defaultColor: '#10b981', defaultSize: 1 },
  ],
  BOLL: [
    { key: 'up', label: '上轨', defaultColor: '#3b82f6', defaultSize: 1 },
    { key: 'mid', label: '中轨', defaultColor: '#f59e0b', defaultSize: 1 },
    { key: 'down', label: '下轨', defaultColor: '#8b5cf6', defaultSize: 1 },
  ],
  MACD: [
    { key: 'dif', label: 'DIF', defaultColor: '#3b82f6', defaultSize: 1 },
    { key: 'dea', label: 'DEA', defaultColor: '#f59e0b', defaultSize: 1 },
    { key: 'macd', label: 'MACD柱', defaultColor: '#ef4444', defaultSize: 1 },
  ],
  RSI: [
    { key: 'rsi1', label: 'RSI1(6)', defaultColor: '#3b82f6', defaultSize: 1 },
    { key: 'rsi2', label: 'RSI2(12)', defaultColor: '#f59e0b', defaultSize: 1 },
    { key: 'rsi3', label: 'RSI3(24)', defaultColor: '#8b5cf6', defaultSize: 1 },
  ],
  KDJ: [
    { key: 'k', label: 'K', defaultColor: '#f59e0b', defaultSize: 1 },
    { key: 'd', label: 'D', defaultColor: '#3b82f6', defaultSize: 1 },
    { key: 'j', label: 'J', defaultColor: '#8b5cf6', defaultSize: 1 },
  ],
  DMI: [
    { key: 'pdi', label: 'PDI', defaultColor: '#ef4444', defaultSize: 1 },
    { key: 'mdi', label: 'MDI', defaultColor: '#22c55e', defaultSize: 1 },
    { key: 'adx', label: 'ADX', defaultColor: '#f59e0b', defaultSize: 1 },
    { key: 'adxr', label: 'ADXR', defaultColor: '#8b5cf6', defaultSize: 1 },
  ],
  OBV: [
    { key: 'obv', label: 'OBV', defaultColor: '#3b82f6', defaultSize: 1 },
    { key: 'maObv', label: 'MAOBV', defaultColor: '#f59e0b', defaultSize: 1 },
  ],
  FI: [
    { key: 'fi2', label: 'FI2', defaultColor: '#3b82f6', defaultSize: 1 },
    { key: 'fi13', label: 'FI13', defaultColor: '#f59e0b', defaultSize: 1 },
    { key: 'fiDiff', label: '差值', defaultColor: '#22c55e', defaultSize: 1 },
  ],
}

const STORAGE_KEY = 'indicator-style-settings'
const ALL_INDICATOR_LIST = Object.keys(INDICATOR_FIELDS)

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* ignore */
  }
}

function IndicatorSettingsModal({ isOpen, onClose, activeIndicators = [], chartInstance }) {
  const [selectedIndicator, setSelectedIndicator] = useState(null)
  const [allSettings, setAllSettings] = useState({})
  const [editingSettings, setEditingSettings] = useState({})

  useEffect(() => {
    if (isOpen) {
      const loaded = loadSettings()
      setAllSettings(loaded)
      const firstAvailable = activeIndicators.length > 0 ? activeIndicators[0] : ALL_INDICATOR_LIST[0]
      setSelectedIndicator(firstAvailable)
      setEditingSettings(loaded[firstAvailable] || {})
    }
  }, [isOpen, activeIndicators])

  useEffect(() => {
    if (selectedIndicator) {
      setEditingSettings(allSettings[selectedIndicator] || {})
    }
  }, [selectedIndicator, allSettings])

  const handleColorChange = (key, color) => {
    setEditingSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], color }
    }))
  }

  const handleSizeChange = (key, size) => {
    const numSize = parseInt(size, 10) || 1
    setEditingSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], size: numSize }
    }))
  }

  const handleResetIndicator = () => {
    if (!selectedIndicator) return
    const fields = INDICATOR_FIELDS[selectedIndicator]
    if (!fields) return
    const defaults = {}
    fields.forEach(f => {
      defaults[f.key] = { color: f.defaultColor, size: f.defaultSize }
    })
    setEditingSettings(defaults)
  }

  const handleResetAll = () => {
    setAllSettings({})
    setEditingSettings({})
  }

  const handleSave = () => {
    const updated = { ...allSettings }
    if (selectedIndicator) {
      updated[selectedIndicator] = editingSettings
    }
    setAllSettings(updated)
    saveSettings(updated)

    // 应用当前编辑的指标样式
    if (chartInstance && selectedIndicator) {
      const fields = INDICATOR_FIELDS[selectedIndicator]
      if (fields) {
        const overrideConfig = { styles: { line: {} } }
        fields.forEach(field => {
          const s = editingSettings[field.key] || {}
          overrideConfig.styles.line[field.key] = {
            color: s.color || field.defaultColor,
            size: s.size || field.defaultSize,
          }
        })
        chartInstance.overrideIndicator(selectedIndicator, overrideConfig)
      }
    }

    onClose()
  }

  const handleSelectIndicator = (name) => {
    // 保存当前编辑的设置
    if (selectedIndicator) {
      setAllSettings(prev => ({
        ...prev,
        [selectedIndicator]: editingSettings
      }))
    }
    setSelectedIndicator(name)
  }

  if (!isOpen) return null

  const fields = selectedIndicator ? INDICATOR_FIELDS[selectedIndicator] || [] : []

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="指标样式设置" width="max-w-3xl" showFooter={false}>
      <div className="flex" style={{ height: '420px' }}>
        {/* 左侧：指标列表 */}
        <div className="flex-shrink-0 border-r border-gray-200" style={{ width: '200px' }}>
          <div className="p-3 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-400">指标列表</span>
          </div>
          <div className="overflow-auto" style={{ height: 'calc(420px - 44px)' }}>
            <div className="p-2 space-y-1">
              {ALL_INDICATOR_LIST.map(ind => {
                const isActive = activeIndicators.includes(ind)
                const isSelected = selectedIndicator === ind
                const hasCustom = allSettings[ind] && Object.keys(allSettings[ind]).length > 0
                return (
                  <button
                    key={ind}
                    onClick={() => handleSelectIndicator(ind)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{ind}</span>
                    <div className="flex items-center gap-1">
                      {hasCustom && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="已自定义" />
                      )}
                      {!isActive && (
                        <span className="text-xs text-gray-300">未启用</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 右侧：样式设置 */}
        <div className="flex-1 overflow-auto" style={{ height: 'calc(420px - 44px)' }}>
          {selectedIndicator && fields.length > 0 ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-700">{selectedIndicator} 线条设置</h4>
                <button
                  onClick={handleResetIndicator}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  恢复该指标默认
                </button>
              </div>
              <div className="space-y-2">
                {fields.map(field => {
                  const currentSettings = editingSettings[field.key] || {}
                  const color = currentSettings.color || field.defaultColor
                  const size = currentSettings.size ?? field.defaultSize

                  return (
                    <div key={field.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-2 rounded-full"
                          style={{ backgroundColor: color, height: `${Math.max(2, size)}px` }}
                        />
                        <span className="text-sm text-gray-700">{field.label}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">颜色</span>
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => handleColorChange(field.key, e.target.value)}
                            className="w-7 h-7 rounded cursor-pointer border border-gray-200 p-0.5"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">粗细</span>
                          <select
                            value={size}
                            onChange={(e) => handleSizeChange(field.key, e.target.value)}
                            className="w-16 px-2 py-1 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={1}>1 - 细</option>
                            <option value={2}>2 - 中</option>
                            <option value={3}>3 - 粗</option>
                            <option value={4}>4 - 特粗</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300 text-sm">
              请选择一个指标进行设置
            </div>
          )}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
        <button
          onClick={handleResetAll}
          className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        >
          恢复全部默认
        </button>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function applySavedIndicatorStyles(chart) {
  if (!chart) return
  const allSettings = loadSettings()
  Object.keys(allSettings).forEach(indicatorName => {
    const settings = allSettings[indicatorName]
    const fields = INDICATOR_FIELDS[indicatorName]
    if (!fields) return

    const hasCustomStyle = fields.some(f => settings[f.key])
    if (!hasCustomStyle) return

    const overrideConfig = { styles: { line: {} } }
    fields.forEach(field => {
      const s = settings[field.key] || {}
      overrideConfig.styles.line[field.key] = {
        color: s.color || field.defaultColor,
        size: s.size || field.defaultSize,
      }
    })
    try {
      chart.overrideIndicator(indicatorName, overrideConfig)
    } catch (e) {
      console.warn('[IndicatorSettings] Failed to apply style for', indicatorName, e)
    }
  })
}

export default IndicatorSettingsModal
