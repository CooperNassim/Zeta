import React from 'react'
import { motion } from 'framer-motion'
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
  getFieldComponent,
  width
}) => {
  const handleChange = (newFormData, clearError = null) => {
    onFormDataChange(newFormData, clearError)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width={width || "max-w-6xl"}
      footer={
        <>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm"
          >
            取消
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            form="dataForm"
            className="px-4 py-2 rounded text-white hover:opacity-90 transition-opacity text-sm"
            style={{ backgroundColor: '#0F1419' }}
          >
            保存
          </motion.button>
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
