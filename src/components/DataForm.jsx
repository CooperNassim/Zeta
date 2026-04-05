import React from 'react'
import CustomDatePicker from './CustomDatePicker'
import CustomSelect from './CustomSelect'
import CustomInput from './CustomInput'
import ReadOnlyInput from './ReadOnlyInput'
import ErrorMessage from './ErrorMessage'

const DataForm = ({
  fields,
  formData,
  formErrors,
  formErrorMessage,
  onChange,
  getFieldComponent
}) => {
  // 检查是否有grid字段
  const hasGridFields = fields.some(f => f.grid)
  
  return (
    <div className={hasGridFields ? "grid grid-cols-3 gap-4" : "grid grid-cols-2 md:grid-cols-4 gap-4"}>
      {fields.map(field => {
        // 跳过标记为notRequired且不是readonly的字段，或标记为hideInForm的字段
        if ((field.notRequired && !field.readonly) || field.hideInForm) {
          return null
        }
        const isFullWidth = field.fullWidth !== false && (field.fullWidth || field.type === 'textarea')
        return (
        <div key={field.key} className={
          hasGridFields ? (isFullWidth ? 'col-span-3' : 'col-span-1') :
          (isFullWidth ? 'col-span-2 md:col-span-4' : '')
        }>
          <label className="block text-sm text-gray-600 mb-1.5">
            {field.required && <span className="text-red-500">*</span>} {field.label}
          </label>
          {field.readonly ? (
            <ReadOnlyInput
              value={formData[field.key] || ''}
              placeholder={field.placeholder || ''}
            />
          ) : getFieldComponent ? (
            getFieldComponent(field, formData, formErrors, onChange)
          ) : (
            field.type === 'date' ? (
              <CustomDatePicker
                value={formData[field.key] || ''}
                onChange={(date) => {
                  onChange({ ...formData, [field.key]: date })
                  if (date && formErrors[field.key]) {
                    onChange({ ...formData, [field.key]: date }, { [field.key]: false })
                  }
                }}
                placeholder="请输入"
                className="w-full"
                error={!!formErrors[field.key]}
              />
            ) : field.options ? (
              <CustomSelect
                value={formData[field.key] || ''}
                onChange={(value) => {
                  onChange({ ...formData, [field.key]: value })
                  if (value && formErrors[field.key]) {
                    onChange({ ...formData, [field.key]: value }, { [field.key]: false })
                  }
                }}
                options={field.options}
                placeholder="请选择"
                error={!!formErrors[field.key]}
              />
            ) : field.type === 'textarea' ? (
              <CustomInput
                type="textarea"
                value={formData[field.key] || ''}
                onChange={(value) => {
                  onChange({ ...formData, [field.key]: value })
                  if (value && formErrors[field.key]) {
                    onChange({ ...formData, [field.key]: value }, { [field.key]: false })
                  }
                }}
                placeholder={field.placeholder || '请输入'}
                error={!!formErrors[field.key]}
                rows={field.rows || 2}
              />
            ) : (
              <CustomInput
                type={field.inputType || 'text'}
                value={formData[field.key] || ''}
                onChange={(value) => {
                  onChange({ ...formData, [field.key]: value })
                  if (value && formErrors[field.key]) {
                    onChange({ ...formData, [field.key]: value }, { [field.key]: false })
                  }
                }}
                placeholder={field.placeholder || '请输入'}
                error={!!formErrors[field.key]}
              />
            )
          )}
          {(!field.notRequired || field.required) && !field.readonly && formErrors[field.key] && (
            <ErrorMessage message={formErrors[field.key] || '不能为空'} />
          )}
        </div>
        )
      })}
    </div>
  )
}

export default DataForm
