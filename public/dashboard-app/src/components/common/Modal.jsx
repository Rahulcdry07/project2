import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Custom modal dialog component
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = ''
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'modal-sm',
    md: '',
    lg: 'modal-lg',
    xl: 'modal-xl'
  };

  return (
    <>
      {/* Modal backdrop */}
      {closeOnBackdrop && (
        <div
          className="modal-backdrop fade show"
          onClick={handleBackdropClick}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1040 }}
          aria-hidden="true"
        />
      )}
      
      {/* Modal dialog */}
      <div
        className={`modal fade show d-block ${className}`}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
        style={{ zIndex: 1050, pointerEvents: 'none' }}
      >
        <div 
          className={`modal-dialog modal-dialog-centered ${sizeClasses[size]}`} 
          ref={modalRef}
          style={{ pointerEvents: 'auto' }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="modalTitle">
                {title}
              </h5>
              {showCloseButton && (
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  aria-label="Close"
                ></button>
              )}
            </div>
            <div className="modal-body">
              {children}
            </div>
            {footer && (
              <div className="modal-footer">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  showCloseButton: PropTypes.bool,
  closeOnBackdrop: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  className: PropTypes.string,
};

/**
 * Confirm dialog modal
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn btn-${variant}`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </>
      }
    >
      <p className="mb-0">{message}</p>
    </Modal>
  );
};

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'danger', 'warning', 'success', 'info']),
  isLoading: PropTypes.bool,
};

export default Modal;
