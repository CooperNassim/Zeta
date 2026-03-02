import React from 'react'
import CustomDatePicker from './CustomDatePicker'
import CustomSelect from './CustomSelect'
import CustomInput from './CustomInput'

const DataForm = ({
  fields,
  formData,
  formErrors,
  onChange,
  getFieldComponent
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {fields.map(field => (
        <div key={field.key}>
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
                error={formErrors[field.key]}
              />
            ) : field.type === 'textarea' ? (
              <textarea
                value={formData[field.key] || ''}
                onChange={(e) => {
                  onChange({ ...formData, [field.key]: e.target.value })
                  if (e.target.value && formErrors[field.key]) {
                    onChange({ ...formData, [field.key]: e.target.value }, { [field.key]: false })
                  }
                }}
                placeholder="请输入"
                className={`w-full px-3 py-2 border ${formErrors[field.key] ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                rows={2}
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
                placeholder="请输入"
                error={formErrors[field.key]}
              />
            )
          )}
          {!field.notRequired && !field.readonly && formErrors[field.key] && (
            <p className="text-red-500 text-xs mt-1">不能为空</p>
          )}
        </div>
      ))}
    </div>
  )
}

export default DataForm
