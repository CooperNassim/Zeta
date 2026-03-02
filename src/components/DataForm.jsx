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
            <span className="text-red-500">*</span> {field.label}
          </label>
          {getFieldComponent ? (
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
          {formErrors[field.key] && (
            <p className="text-red-500 text-xs mt-1">不能为空</p>
          )}
        </div>
      ))}
    </div>
  )
}

export default DataForm
