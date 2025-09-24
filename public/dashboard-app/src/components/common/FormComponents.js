import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatErrorMessage } from '../../utils/helpers';

/**
 * Input field component with label and error handling
 */
const FormInput = ({ 
    type, 
    name, 
    value, 
    onChange, 
    onBlur, 
    label, 
    error, 
    touched,
    placeholder,
    required = false,
    autoComplete = 'on'
}) => {
    return (
        <div className="form-group">
            <label htmlFor={name}>{label}{required && <span className="text-danger">*</span>}</label>
            <input
                type={type}
                className={`form-control ${touched && error ? 'is-invalid' : ''}`}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={placeholder || label}
                required={required}
                autoComplete={autoComplete}
            />
            {touched && error && (
                <div className="invalid-feedback">{error}</div>
            )}
        </div>
    );
};

FormInput.propTypes = {
    type: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired,
    label: PropTypes.string.isRequired,
    error: PropTypes.string,
    touched: PropTypes.bool,
    placeholder: PropTypes.string,
    required: PropTypes.bool,
    autoComplete: PropTypes.string
};

/**
 * Alert component for displaying errors or success messages
 */
export const Alert = ({ 
    type = 'danger', 
    message,
    onClose 
}) => {
    if (!message) return null;
    
    return (
        <div className={`alert alert-${type} alert-dismissible fade show`} role="alert">
            {message}
            {onClose && (
                <button 
                    type="button" 
                    className="btn-close" 
                    onClick={onClose} 
                    aria-label="Close"
                />
            )}
        </div>
    );
};

Alert.propTypes = {
    type: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info']),
    message: PropTypes.string,
    onClose: PropTypes.func
};

/**
 * Loading spinner component
 */
export const Spinner = ({ 
    size = 'md', 
    centered = false, 
    text = 'Loading...' 
}) => {
    const spinnerSizeClass = size === 'sm' ? 'spinner-border-sm' : '';
    const containerClass = centered ? 'd-flex justify-content-center align-items-center' : '';
    
    return (
        <div className={containerClass}>
            <div className="d-flex align-items-center">
                <div className={`spinner-border ${spinnerSizeClass} me-2`} role="status">
                    <span className="visually-hidden">{text}</span>
                </div>
                {text && <span>{text}</span>}
            </div>
        </div>
    );
};

Spinner.propTypes = {
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    centered: PropTypes.bool,
    text: PropTypes.string
};

/**
 * Card component for encapsulating content
 */
export const Card = ({ 
    title, 
    children, 
    className = '',
    footer = null
}) => {
    return (
        <div className={`card shadow-sm ${className}`}>
            {title && <div className="card-header">{title}</div>}
            <div className="card-body">
                {children}
            </div>
            {footer && <div className="card-footer">{footer}</div>}
        </div>
    );
};

Card.propTypes = {
    title: PropTypes.node,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    footer: PropTypes.node
};

/**
 * Modal component
 */
export const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md'
}) => {
    if (!isOpen) return null;
    
    const modalSizeClass = size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : '';
    
    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className={`modal-dialog ${modalSizeClass}`}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{title}</h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
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
    );
};

Modal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.node.isRequired,
    children: PropTypes.node.isRequired,
    footer: PropTypes.node,
    size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

/**
 * Confirmation dialog component
 */
export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmButtonType = 'danger'
}) => {
    const [isLoading, setIsLoading] = useState(false);
    
    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm();
        } catch (error) {
            console.error('Confirmation action failed:', error);
        } finally {
            setIsLoading(false);
            onClose();
        }
    };
    
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
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
                        className={`btn btn-${confirmButtonType}`}
                        onClick={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Processing...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </>
            }
        >
            <p>{message}</p>
        </Modal>
    );
};

ConfirmDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    title: PropTypes.string,
    message: PropTypes.string,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    confirmButtonType: PropTypes.string
};

/**
 * Error boundary component
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
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
        // Can also send error to a reporting service
    }

    render() {
        if (this.state.hasError) {
            const message = formatErrorMessage(this.state.error);
            
            return (
                <div className="container mt-5">
                    <div className="alert alert-danger">
                        <h4 className="alert-heading">Something went wrong</h4>
                        <p>{message}</p>
                        <hr />
                        <div className="d-flex justify-content-between">
                            <button 
                                className="btn btn-outline-danger" 
                                onClick={() => window.location.reload()}
                            >
                                Reload Page
                            </button>
                            <Link to="/" className="btn btn-primary">
                                Go to Homepage
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired
};

export default FormInput;