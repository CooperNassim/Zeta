import React from 'react'
import { Play, Save, FolderOpen, ChevronDown, ChevronUp, Plus, X } from 'lucide-react'

const IndicatorTypes = [
  { value: 'MA', label: 'MA 均线' },
  { value: 'MACD', label: 'MACD' },
  { value: 'RSI', label: 'RSI' },
  { value: 'KDJ', label: 'KDJ' },
  { value: 'BOLL', label: 'BOLL 布林带' },
  { value: 'VOL', label: '成交量' },
]

const PositionModes = [
  { value: 'FIXED_AMOUNT', label: '固定金额' },
  { value: 'FIXED_RATIO', label: '固定比例' },
  { value: 'FIXED_SHARES', label: '固定股数' },
]

const StopLossTypes = [
  { value: 'FIXED', label: '固定止损' },
  { value: 'TRAILING', label: '移动止损' },
  { value: 'ATR', label: 'ATR止损' },
  { value: 'TIME', label: '时间止损' },
]

const TakeProfitTypes = [
  { value: 'FIXED', label: '固定止盈' },
  { value: 'TRAILING', label: '跟踪止盈' },
]

const Operators = [
  { value: 'GREATER_THAN', label: '大于' },
  { value: 'LESS_THAN', label: '小于' },
  { value: 'EQUAL', label: '等于' },
  { value: 'CROSS_ABOVE', label: '上穿（金叉）' },
  { value: 'CROSS_BELOW', label: '下穿（死叉）' },
]

const CompareTypes = [
  { value: 'PREVIOUS_DAYS', label: '前 N 天' },
  { value: 'PREVIOUS_WEEKS', label: '前 N 周' },
  { value: 'PREVIOUS_MONTHS', label: '前 N 月' },
  { value: 'FIXED_VALUE', label: '固定值' },
  { value: 'INDICATOR_FIELD', label: '指标字段' },
  { value: 'INDICATOR_CROSS', label: '指标交叉' },
]

const SourceTypes = [
  { value: 'INDICATOR', label: '技术指标' },
  { value: 'PRICE', label: '价格' },
  { value: 'VOLUME', label: '成交量' },
]

const SourceFields = {
  MACD: [
    { value: 'DIF', label: 'DIF' },
    { value: 'DEA', label: 'DEA' },
    { value: 'MACD', label: 'MACD柱' },
  ],
  RSI: [
    { value: 'VALUE', label: 'RSI值' },
  ],
  KDJ: [
    { value: 'K', label: 'K值' },
    { value: 'D', label: 'D值' },
    { value: 'J', label: 'J值' },
  ],
  BOLL: [
    { value: 'UPPER', label: '上轨' },
    { value: 'MIDDLE', label: '中轨' },
    { value: 'LOWER', label: '下轨' },
  ],
  MA: [
    { value: 'SHORT', label: '短期均线' },
    { value: 'LONG', label: '长期均线' },
  ],
  VOL: [
    { value: 'VALUE', label: '成交量' },
    { value: 'MA_VOL', label: '均量' },
  ],
  PRICE: [
    { value: 'CLOSE', label: '收盘价' },
    { value: 'OPEN', label: '开盘价' },
    { value: 'HIGH', label: '最高价' },
    { value: 'LOW', label: '最低价' },
  ],
  VOLUME: [
    { value: 'VALUE', label: '成交量' },
  ],
}

const TimeUnits = [
  { value: 'DAYS', label: '天' },
  { value: 'WEEKS', label: '周' },
  { value: 'MONTHS', label: '月' },
]

const LabeledInput = ({ label, value, onChange, placeholder = '请输入', type = 'text', step }) => {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs text-gray-500">{label}</label>}
      <input
        type={type}
        step={step}
        value={value !== null && value !== undefined ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 transition-colors text-sm"
        placeholder={placeholder}
        style={{ color: value != null && value !== '' ? '#1f2937' : '#9ca3af' }}
      />
    </div>
  )
}

const LabeledSelect = ({ label, value, onChange, options }) => {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs text-gray-500">{label}</label>}
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 transition-colors text-sm bg-white"
        style={{ color: value ? '#1f2937' : '#9ca3af' }}
      >
        <option value="">请选择</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

const ConditionRow = ({ condition, onChange, onRemove, showRemove }) => {
  const sourceFields = SourceFields[condition.source === 'INDICATOR' ? condition.indicator : condition.source] || []

  return (
    <div className="flex items-start gap-2 p-2 bg-gray-100 rounded-lg">
      <div className="flex-1 grid grid-cols-2 gap-2">
        <LabeledSelect
          label="数据源"
          value={condition.source || 'INDICATOR'}
          onChange={(v) => onChange('source', v)}
          options={SourceTypes}
        />
        {condition.source && (
          <LabeledSelect
            label="字段"
            value={condition.sourceField || ''}
            onChange={(v) => onChange('sourceField', v)}
            options={sourceFields}
          />
        )}
        <LabeledSelect
          label="条件"
          value={condition.operator || ''}
          onChange={(v) => onChange('operator', v)}
          options={Operators}
        />
        <LabeledSelect
          label="比较对象"
          value={condition.compareType || ''}
          onChange={(v) => onChange('compareType', v)}
          options={CompareTypes}
        />
      </div>

      {condition.compareType === 'PREVIOUS_DAYS' || condition.compareType === 'PREVIOUS_WEEKS' || condition.compareType === 'PREVIOUS_MONTHS' ? (
        <div className="flex items-end gap-1 mt-4">
          <input
            type="number"
            value={condition.compareValue || 1}
            onChange={(e) => onChange('compareValue', parseInt(e.target.value) || 1)}
            className="w-16 px-2 py-2 border border-gray-300 rounded text-sm text-center"
          />
          <span className="text-xs text-gray-500 pb-2">
            {condition.compareType === 'PREVIOUS_DAYS' ? '天' : condition.compareType === 'PREVIOUS_WEEKS' ? '周' : '月'}
          </span>
        </div>
      ) : condition.compareType === 'FIXED_VALUE' ? (
        <div className="flex items-end mt-4">
          <input
            type="number"
            value={condition.compareValue || 0}
            onChange={(e) => onChange('compareValue', parseFloat(e.target.value) || 0)}
            className="w-20 px-2 py-2 border border-gray-300 rounded text-sm text-center"
          />
        </div>
      ) : condition.compareType === 'INDICATOR_FIELD' ? (
        <div className="flex flex-col gap-1 mt-4">
          <select
            value={condition.compareIndicator || ''}
            onChange={(e) => onChange('compareIndicator', e.target.value)}
            className="px-2 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="">指标</option>
            {IndicatorTypes.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={condition.compareField || ''}
            onChange={(e) => onChange('compareField', e.target.value)}
            className="px-2 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="">字段</option>
            {(SourceFields[condition.compareIndicator] || []).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      ) : condition.compareType === 'INDICATOR_CROSS' ? (
        <div className="flex flex-col gap-1 mt-4">
          <select
            value={condition.compareIndicator || ''}
            onChange={(e) => onChange('compareIndicator', e.target.value)}
            className="px-2 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="">指标</option>
            {IndicatorTypes.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="flex gap-1">
            <select
              value={condition.field1 || ''}
              onChange={(e) => onChange('field1', e.target.value)}
              className="px-2 py-2 border border-gray-300 rounded text-sm flex-1"
            >
              <option value="">字段1</option>
              {(SourceFields[condition.compareIndicator] || []).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={condition.field2 || ''}
              onChange={(e) => onChange('field2', e.target.value)}
              className="px-2 py-2 border border-gray-300 rounded text-sm flex-1"
            >
              <option value="">字段2</option>
              {(SourceFields[condition.compareIndicator] || []).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {showRemove && (
        <button
          onClick={onRemove}
          className="mt-2 text-red-400 hover:text-red-600"
          title="删除条件"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

const ConditionGroup = ({ label, conditions, onConditionsChange, color }) => {
  const [logic, setLogic] = React.useState(conditions.logic || 'AND')

  const handleLogicChange = (newLogic) => {
    setLogic(newLogic)
    onConditionsChange({ ...conditions, logic: newLogic })
  }

  const handleAddCondition = () => {
    const newConditions = [...(conditions.conditions || []), {
      source: 'INDICATOR',
      sourceField: '',
      operator: 'GREATER_THAN',
      compareType: 'FIXED_VALUE',
      compareValue: 0,
    }]
    onConditionsChange({ ...conditions, logic, conditions: newConditions })
  }

  const handleRemoveCondition = (index) => {
    const newConditions = conditions.conditions.filter((_, i) => i !== index)
    onConditionsChange({ ...conditions, logic, conditions: newConditions })
  }

  const handleConditionChange = (index, field, value) => {
    const newConditions = [...conditions.conditions]
    newConditions[index] = { ...newConditions[index], [field]: value }
    onConditionsChange({ ...conditions, logic, conditions: newConditions })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color }}>{label}</span>
          <span className="text-xs text-gray-400">
            逻辑关系：
            <button
              onClick={() => handleLogicChange('AND')}
              className={`px-2 py-0.5 rounded text-xs ${logic === 'AND' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              且 (AND)
            </button>
            <button
              onClick={() => handleLogicChange('OR')}
              className={`px-2 py-0.5 rounded text-xs ml-1 ${logic === 'OR' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              或 (OR)
            </button>
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {conditions.conditions && conditions.conditions.map((cond, index) => (
          <ConditionRow
            key={index}
            condition={cond}
            onChange={(field, value) => handleConditionChange(index, field, value)}
            onRemove={() => handleRemoveCondition(index)}
            showRemove={conditions.conditions.length > 1}
          />
        ))}
      </div>

      <button
        onClick={handleAddCondition}
        className="w-full py-1.5 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500 flex items-center justify-center gap-1"
      >
        <Plus className="w-3 h-3" />
        添加条件
      </button>
    </div>
  )
}

const ConfigPanel = ({
  config,
  onConfigChange,
  onRunBacktest,
  onSaveConfig,
  onLoadConfig,
  isRunning,
  progress,
  savedConfigs,
  showSavedConfigs,
  setShowSavedConfigs,
}) => {
  const [expandedSections, setExpandedSections] = React.useState({
    basic: true,
    indicators: true,
    buy: true,
    sell: true,
    risk: false,
    position: false,
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleAddIndicator = (type) => {
    const defaultParams = {
      MA: { shortPeriod: 5, longPeriod: 20 },
      MACD: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
      RSI: { period: 14 },
      KDJ: { n: 9, m1: 3, m2: 3 },
      BOLL: { period: 20, stdDevMultiplier: 2 },
      VOL: { maPeriod: 5 },
    }
    onConfigChange('indicators', [
      ...config.indicators,
      { type, params: defaultParams[type] || {} }
    ])
  }

  const handleRemoveIndicator = (index) => {
    onConfigChange('indicators', config.indicators.filter((_, i) => i !== index))
  }

  const handleIndicatorParamChange = (index, param, value) => {
    const newIndicators = [...config.indicators]
    newIndicators[index] = {
      ...newIndicators[index],
      params: { ...newIndicators[index].params, [param]: parseFloat(value) || 0 }
    }
    onConfigChange('indicators', newIndicators)
  }

  const paramLabels = {
    fastPeriod: '快线周期',
    slowPeriod: '慢线周期',
    signalPeriod: '信号周期',
    shortPeriod: '短期周期',
    longPeriod: '长期周期',
    period: '周期',
    stdDevMultiplier: '标准差倍数',
    maPeriod: '均线周期',
    n: 'N周期',
    m1: 'M1',
    m2: 'M2',
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">回测配置</h2>
        <button
          onClick={() => setShowSavedConfigs(!showSavedConfigs)}
          className="p-2 text-gray-600 hover:text-gray-900"
          title="已保存配置"
        >
          <FolderOpen className="w-5 h-5" />
        </button>
      </div>

      {showSavedConfigs && savedConfigs && savedConfigs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
          <h3 className="text-sm font-medium text-gray-700">已保存配置</h3>
          {savedConfigs.map(c => (
            <button
              key={c.id}
              onClick={() => onLoadConfig(c)}
              className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* 基础设置 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('basic')}>
          <h3 className="text-sm font-medium text-gray-700">基础设置</h3>
          {expandedSections.basic ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
        {expandedSections.basic && (
          <div className="space-y-3">
            <LabeledInput
              label="回测名称"
              value={config.name}
              onChange={(v) => onConfigChange('name', v)}
              placeholder="输入回测名称"
            />
            <LabeledInput
              label="初始资金"
              type="number"
              value={config.initialCapital}
              onChange={(v) => onConfigChange('initialCapital', parseFloat(v) || 100000)}
              placeholder="100000"
            />
            <LabeledInput
              label="手续费率"
              type="number"
              step="0.0001"
              value={config.commissionRate}
              onChange={(v) => onConfigChange('commissionRate', parseFloat(v) || 0.0003)}
              placeholder="0.0003"
            />
            <LabeledInput
              label="股票代码（逗号分隔）"
              value={config.stockCodes?.join(',')}
              onChange={(v) => onConfigChange('stockCodes', v.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="600519,000001"
            />
            <div className="grid grid-cols-2 gap-2">
              <LabeledInput
                label="开始日期"
                type="date"
                value={config.startDate}
                onChange={(v) => onConfigChange('startDate', v)}
              />
              <LabeledInput
                label="结束日期"
                type="date"
                value={config.endDate}
                onChange={(v) => onConfigChange('endDate', v)}
              />
            </div>
          </div>
        )}
      </div>

      {/* 技术指标 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('indicators')}>
          <h3 className="text-sm font-medium text-gray-700">技术指标</h3>
          {expandedSections.indicators ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
        {expandedSections.indicators && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {IndicatorTypes.map(ind => (
                <button
                  key={ind.value}
                  onClick={() => handleAddIndicator(ind.value)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-xs font-medium transition-colors"
                >
                  + {ind.label}
                </button>
              ))}
            </div>
            {config.indicators && config.indicators.length > 0 && config.indicators.map((ind, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {IndicatorTypes.find(t => t.value === ind.type)?.label || ind.type}
                  </span>
                  <button
                    onClick={() => handleRemoveIndicator(index)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(ind.params || {}).map(param => (
                    <LabeledInput
                      key={param}
                      label={paramLabels[param] || param}
                      type="number"
                      value={ind.params[param]}
                      onChange={(v) => handleIndicatorParamChange(index, param, v)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 买入条件 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('buy')}>
          <h3 className="text-sm font-medium text-green-700">买入条件</h3>
          {expandedSections.buy ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
        {expandedSections.buy && (
          <div className="p-3 bg-green-50 rounded-lg">
            <ConditionGroup
              label="当满足以下条件时买入"
              conditions={config.buyConditions || { logic: 'AND', conditions: [] }}
              onConditionsChange={(v) => onConfigChange('buyConditions', v)}
              color="#16a34a"
            />
          </div>
        )}
      </div>

      {/* 卖出条件 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('sell')}>
          <h3 className="text-sm font-medium text-red-700">卖出条件</h3>
          {expandedSections.sell ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
        {expandedSections.sell && (
          <div className="p-3 bg-red-50 rounded-lg">
            <ConditionGroup
              label="当满足以下条件时卖出"
              conditions={config.sellConditions || { logic: 'AND', conditions: [] }}
              onConditionsChange={(v) => onConfigChange('sellConditions', v)}
              color="#dc2626"
            />
          </div>
        )}
      </div>

      {/* 止损止盈 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('risk')}>
          <h3 className="text-sm font-medium text-gray-700">止损止盈</h3>
          {expandedSections.risk ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
        {expandedSections.risk && (
          <div className="space-y-3">
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-xs font-medium text-gray-600">止损配置</h4>
              <LabeledSelect
                label="止损类型"
                value={config.stopLoss?.type || ''}
                onChange={(v) => onConfigChange('stopLoss', v ? { type: v, params: { percentage: 5 } } : null)}
                options={StopLossTypes}
              />
              {config.stopLoss && (
                <LabeledInput
                  label={config.stopLoss.type === 'TIME' ? '最大持有天数' : '止损百分比 (%)'}
                  type="number"
                  value={config.stopLoss.params?.percentage || config.stopLoss.params?.maxDays || 5}
                  onChange={(v) => {
                    const key = config.stopLoss.type === 'TIME' ? 'maxDays' : 'percentage'
                    onConfigChange('stopLoss', {
                      ...config.stopLoss,
                      params: { ...config.stopLoss.params, [key]: parseFloat(v) || 5 }
                    })
                  }}
                />
              )}
            </div>
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-xs font-medium text-gray-600">止盈配置</h4>
              <LabeledSelect
                label="止盈类型"
                value={config.takeProfit?.type || ''}
                onChange={(v) => onConfigChange('takeProfit', v ? { type: v, params: { percentage: 10 } } : null)}
                options={TakeProfitTypes}
              />
              {config.takeProfit && (
                <LabeledInput
                  label="止盈百分比 (%)"
                  type="number"
                  value={config.takeProfit.params?.percentage || 10}
                  onChange={(v) => onConfigChange('takeProfit', {
                    ...config.takeProfit,
                    params: { ...config.takeProfit.params, percentage: parseFloat(v) || 10 }
                  })}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* 仓位管理 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('position')}>
          <h3 className="text-sm font-medium text-gray-700">仓位管理</h3>
          {expandedSections.position ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
        {expandedSections.position && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            <LabeledSelect
              label="仓位模式"
              value={config.positionSizing?.mode || 'FIXED_AMOUNT'}
              onChange={(v) => onConfigChange('positionSizing', { mode: v, params: { amount: 10000 } })}
              options={PositionModes}
            />
            {config.positionSizing?.mode === 'FIXED_AMOUNT' && (
              <LabeledInput
                label="买入金额"
                type="number"
                value={config.positionSizing.params?.amount || 10000}
                onChange={(v) => onConfigChange('positionSizing', {
                  ...config.positionSizing,
                  params: { amount: parseFloat(v) || 10000 }
                })}
              />
            )}
            {config.positionSizing?.mode === 'FIXED_RATIO' && (
              <LabeledInput
                label="买入比例"
                type="number"
                step="0.1"
                value={config.positionSizing.params?.ratio || 0.5}
                onChange={(v) => onConfigChange('positionSizing', {
                  ...config.positionSizing,
                  params: { ratio: parseFloat(v) || 0.5 }
                })}
              />
            )}
            {config.positionSizing?.mode === 'FIXED_SHARES' && (
              <LabeledInput
                label="买入股数"
                type="number"
                value={config.positionSizing.params?.shares || 100}
                onChange={(v) => onConfigChange('positionSizing', {
                  ...config.positionSizing,
                  params: { shares: parseInt(v) || 100 }
                })}
              />
            )}
          </div>
        )}
      </div>

      {isRunning && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">回测中...</span>
            <span className="text-blue-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          onClick={onRunBacktest}
          disabled={isRunning}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          运行回测
        </button>
        <button
          onClick={onSaveConfig}
          className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          保存
        </button>
      </div>
    </div>
  )
}

export default ConfigPanel
