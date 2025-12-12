import React from 'react';
import PropTypes from 'prop-types';

/**
 * Enhanced error display component with specific guidance and retry functionality
 */
const ErrorDisplay = ({ 
  error, 
  onRetry, 
  retryText = 'Try Again',
  showRetry = true,
  className = ''
}) => {
  if (!error) return null;

  // Map common error messages to user-friendly guidance
  const getErrorGuidance = (errorMessage) => {
    const lowerError = errorMessage.toLowerCase();
    
    // Network errors
    if (lowerError.includes('network') || lowerError.includes('failed to fetch')) {
      return {
        title: 'Connection Problem',
        message: 'Unable to connect to the server.',
        suggestions: [
          'Check your internet connection',
          'The server might be temporarily unavailable',
          'Try again in a few moments'
        ]
      };
    }
    
    // Authentication errors
    if (lowerError.includes('unauthorized') || lowerError.includes('invalid credentials') || lowerError.includes('login failed')) {
      return {
        title: 'Authentication Failed',
        message: errorMessage,
        suggestions: [
          'Double-check your email and password',
          'Ensure caps lock is not on',
          'Try resetting your password if you forgot it'
        ]
      };
    }
    
    // Validation errors
    if (lowerError.includes('validation') || lowerError.includes('invalid')) {
      return {
        title: 'Invalid Input',
        message: errorMessage,
        suggestions: [
          'Check that all required fields are filled',
          'Ensure email format is correct',
          'Passwords must meet requirements'
        ]
      };
    }
    
    // Permission errors
    if (lowerError.includes('permission') || lowerError.includes('forbidden')) {
      return {
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action.',
        suggestions: [
          'Contact an administrator for access',
          'Ensure you\'re logged in with the correct account'
        ]
      };
    }
    
    // Server errors
    if (lowerError.includes('500') || lowerError.includes('server error')) {
      return {
        title: 'Server Error',
        message: 'Something went wrong on our end.',
        suggestions: [
          'This issue has been logged',
          'Please try again later',
          'Contact support if the problem persists'
        ]
      };
    }
    
    // Registration/user exists errors
    if (lowerError.includes('already exists') || lowerError.includes('already registered')) {
      return {
        title: 'Account Already Exists',
        message: errorMessage,
        suggestions: [
          'Try logging in instead',
          'Use the "Forgot Password" link if you can\'t remember your password',
          'Use a different email address'
        ]
      };
    }
    
    // Default generic error
    return {
      title: 'Error',
      message: errorMessage,
      suggestions: showRetry ? ['Please try again'] : []
    };
  };

  const errorInfo = getErrorGuidance(error);

  return (
    <div className={`alert alert-danger ${className}`} role="alert">
      <div className="d-flex align-items-start">
        <i className="bi bi-exclamation-circle-fill me-2 mt-1" style={{ fontSize: '1.25rem' }}></i>
        <div className="flex-grow-1">
          <h6 className="alert-heading mb-2">{errorInfo.title}</h6>
          <p className="mb-2">{errorInfo.message}</p>
          
          {errorInfo.suggestions && errorInfo.suggestions.length > 0 && (
            <div className="mt-2">
              <small className="d-block mb-1 fw-semibold">Suggestions:</small>
              <ul className="mb-0" style={{ fontSize: '0.875rem', paddingLeft: '1.25rem' }}>
                {errorInfo.suggestions.map((suggestion, idx) => (
                  <li key={idx}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          {showRetry && onRetry && (
            <button 
              onClick={onRetry}
              className="btn btn-sm btn-outline-danger mt-3"
              type="button"
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              {retryText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

ErrorDisplay.propTypes = {
  error: PropTypes.string,
  onRetry: PropTypes.func,
  retryText: PropTypes.string,
  showRetry: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.string,
};

export default ErrorDisplay;
