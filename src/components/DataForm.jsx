import React from 'react'
import CustomDatePicker from './CustomDatePicker'
import CustomSelect from './CustomSelect'
import CustomInput from './CustomInput'
import ErrorMessage from './ErrorMessage'

const DataForm = ({
  fields,
  formData,
  formErrors,
  onChange,
  getFieldComponent
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {fields.map(field => {
        // 跳过标记为notRequired且不是readonly的字段，或标记为hideInForm的字段
        if ((field.notRequired && !field.readonly) || field.hideInForm) {
          return null
        }
        const isFullWidth = field.fullWidth !== false && (field.fullWidth || field.type === 'textarea')
        return (
        <div key={field.key} className={isFullWidth ? 'col-span-2 md:col-span-4' : ''}>
          <label className="block text-sm text-gray-600 mb-1.5">
            {!field.notRequired && <span className="text-red-500">*</span>} {field.label}
          </label>
          {field.readonly ? (
            <input
              type="text"
              value={formData[field.key] || ''}
              readOnly
              className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded text-gray-600"
              disabled
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
          {!field.notRequired && !field.readonly && formErrors[field.key] && (
            <ErrorMessage message={typeof formErrors[field.key] === 'string' ? formErrors[field.key] : '不能为空'} />
          )}
        </div>
        )
      })}
    </div>
  )
}

export default DataForm
