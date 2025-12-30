import React from 'react';
import PropTypes from 'prop-types';
import { logError } from '../../utils/logger';

/**
 * Error Boundary Component
 */
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        logError('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">Something went wrong!</h4>
                    <p>An error occurred while rendering this component.</p>
                    <button 
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired
};

/**
 * Loading Spinner Component
 */
export const LoadingSpinner = ({ size = 'md', message = 'Loading...' }) => {
    const spinnerClass = `spinner-border ${size === 'sm' ? 'spinner-border-sm' : ''}`;
    
    return (
        <div className="d-flex justify-content-center align-items-center p-4">
            <div className={spinnerClass} role="status">
                <span className="visually-hidden">{message}</span>
            </div>
            {message && (
                <span className="ms-2 text-muted">{message}</span>
            )}
        </div>
    );
};

LoadingSpinner.propTypes = {
    size: PropTypes.oneOf(['sm', 'md']),
    message: PropTypes.string
};

/**
 * Alert Component
 */
export const Alert = ({ type = 'info', message, dismissible = false, onDismiss }) => {
    const alertClass = `alert alert-${type} ${dismissible ? 'alert-dismissible fade show' : ''}`;
    
    return (
        <div className={alertClass} role="alert">
            {message}
            {dismissible && (
                <button 
                    type="button" 
                    className="btn-close" 
                    onClick={onDismiss}
                    aria-label="Close"
                ></button>
            )}
        </div>
    );
};

Alert.propTypes = {
    type: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark']),
    message: PropTypes.string.isRequired,
    dismissible: PropTypes.bool,
    onDismiss: PropTypes.func
};