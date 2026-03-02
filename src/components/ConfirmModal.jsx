import React from 'react'
import Modal from './Modal'

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "确认",
  message = "是否确认？"
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#0F1419' }}
          >
            确定
          </button>
        </>
      }
    >
      <p className="text-gray-600">
        {message}
      </p>
    </Modal>
  )
}

export default ConfirmModal
