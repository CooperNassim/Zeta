import React from 'react'
import Modal from './Modal'
import DataForm from './DataForm'

const FormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  fields,
  formData,
  formErrors,
  onFormDataChange,
  getFieldComponent
}) => {
  const handleChange = (newFormData, clearError = null) => {
    onFormDataChange(newFormData, clearError)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width="max-w-6xl"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            form="dataForm"
            className="px-4 py-2 rounded text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#0F1419' }}
          >
            保存
          </button>
        </>
      }
    >
      <form id="dataForm" onSubmit={onSubmit} className="space-y-4">
        <DataForm
          fields={fields}
          formData={formData}
          formErrors={formErrors}
          onChange={handleChange}
          getFieldComponent={getFieldComponent}
        />
      </form>
    </Modal>
  )
}

export default FormModal
