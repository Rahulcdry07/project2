import React from 'react';
import PropTypes from 'prop-types';

/**
 * Empty state component for displaying when no data is available
 */
const EmptyState = ({ 
  icon = 'bi-inbox',
  title = 'No Data',
  message = 'There is no data to display at the moment.',
  actionText,
  onAction,
  className = ''
}) => {
  return (
    <div className={`text-center py-5 ${className}`}>
      <div className="mb-4">
        <i 
          className={`bi ${icon} text-muted`}
          style={{ fontSize: '4rem', opacity: 0.5 }}
        ></i>
      </div>
      <h4 className="text-muted mb-2">{title}</h4>
      <p className="text-muted mb-4">{message}</p>
      {actionText && onAction && (
        <button 
          className="btn btn-primary"
          onClick={onAction}
        >
          <i className="bi bi-plus-circle me-2"></i>
          {actionText}
        </button>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string,
  message: PropTypes.string,
  actionText: PropTypes.string,
  onAction: PropTypes.func,
  className: PropTypes.string,
};

export default EmptyState;
