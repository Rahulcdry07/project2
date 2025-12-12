import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Toast notification component with auto-dismiss and manual close
 */
const Toast = ({ 
  id,
  message, 
  type = 'info', 
  duration = 5000, 
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose(id);
    }, 300); // Match animation duration
  }, [id, onClose]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  if (!isVisible) return null;

  const typeConfig = {
    success: {
      icon: 'bi-check-circle-fill',
      bgClass: 'bg-success',
      textClass: 'text-white'
    },
    error: {
      icon: 'bi-exclamation-circle-fill',
      bgClass: 'bg-danger',
      textClass: 'text-white'
    },
    warning: {
      icon: 'bi-exclamation-triangle-fill',
      bgClass: 'bg-warning',
      textClass: 'text-dark'
    },
    info: {
      icon: 'bi-info-circle-fill',
      bgClass: 'bg-info',
      textClass: 'text-white'
    }
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div
      className={`toast show ${isExiting ? 'toast-exit' : 'toast-enter'}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        minWidth: '250px',
        maxWidth: '350px',
        boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
      }}
    >
      <div className={`toast-header ${config.bgClass} ${config.textClass}`}>
        <i className={`bi ${config.icon} me-2`}></i>
        <strong className="me-auto text-capitalize">{type}</strong>
        <button
          type="button"
          className={`btn-close ${type === 'warning' ? '' : 'btn-close-white'}`}
          onClick={handleClose}
          aria-label="Close"
        ></button>
      </div>
      <div className="toast-body">
        {message}
      </div>
    </div>
  );
};

Toast.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  duration: PropTypes.number,
  onClose: PropTypes.func,
  position: PropTypes.string,
};

/**
 * Toast container component to manage multiple toasts
 */
export const ToastContainer = ({ toasts = [], onRemove, position = 'top-right' }) => {
  const positionStyles = {
    'top-right': {
      top: '1rem',
      right: '1rem',
    },
    'top-left': {
      top: '1rem',
      left: '1rem',
    },
    'top-center': {
      top: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
    },
    'bottom-right': {
      bottom: '1rem',
      right: '1rem',
    },
    'bottom-left': {
      bottom: '1rem',
      left: '1rem',
    },
    'bottom-center': {
      bottom: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
    },
  };

  return (
    <div
      className="toast-container position-fixed"
      style={{
        zIndex: 9999,
        ...positionStyles[position],
      }}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={onRemove}
          position={position}
        />
      ))}
    </div>
  );
};

ToastContainer.propTypes = {
  toasts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      message: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
      duration: PropTypes.number,
    })
  ),
  onRemove: PropTypes.func,
  position: PropTypes.string,
};

export default Toast;
