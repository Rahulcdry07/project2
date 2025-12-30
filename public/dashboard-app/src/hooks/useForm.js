import { useState, useEffect, useRef } from 'react';
import { logError } from '../utils/logger';

/**
 * Custom hook for managing form state with validation
 * @param {Object} initialValues - Initial form values
 * @param {Function|Object} validateForm - Validation function or validation rules object
 * @param {Function} onSubmit - Optional submit function for tests
 * @param {Object} customValidators - Custom validation functions
 * @returns {Object} Form state and handlers
 */
export const useForm = (initialValues, validateForm, onSubmit, customValidators = {}) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Create a unified validation function
    const runValidation = (valuesToValidate) => {
        let validationErrors = {};
        
        // If validateForm is a function, use it directly
        if (typeof validateForm === 'function') {
            validationErrors = validateForm(valuesToValidate);
        }
        // If validateForm is an object with validation rules, process them
        else if (validateForm && typeof validateForm === 'object') {
            Object.keys(validateForm).forEach(fieldName => {
                const rules = validateForm[fieldName];
                const value = valuesToValidate[fieldName];
                
                // Required validation
                if (rules.required && (!value || value.toString().trim() === '')) {
                    validationErrors[fieldName] = rules.message || `${fieldName} is required`;
                    return;
                }
                
                // Skip further validation if field is empty and not required
                if (!value || value.toString().trim() === '') {
                    return;
                }
                
                // Pattern validation
                if (rules.pattern && !rules.pattern.test(value)) {
                    validationErrors[fieldName] = rules.patternMessage || `Invalid ${fieldName} format`;
                    return;
                }
                
                // Min length validation
                if (rules.minLength && value.length < rules.minLength) {
                    validationErrors[fieldName] = rules.minLengthMessage || `${fieldName} must be at least ${rules.minLength} characters`;
                    return;
                }
                
                // Max length validation
                if (rules.maxLength && value.length > rules.maxLength) {
                    validationErrors[fieldName] = rules.maxLengthMessage || `${fieldName} must be at most ${rules.maxLength} characters`;
                    return;
                }
            });
        }
        
        // Apply custom validators (these take priority)
        Object.keys(customValidators).forEach(fieldName => {
            const customValidator = customValidators[fieldName];
            if (typeof customValidator === 'function') {
                const customError = customValidator(valuesToValidate[fieldName], valuesToValidate);
                if (customError) {
                    validationErrors[fieldName] = customError;
                } else {
                    // Explicitly clear the error if custom validator returns empty/falsy
                    delete validationErrors[fieldName];
                }
            }
        });
        
        // Built-in password confirmation validation (only if no custom validator for confirmPassword)
        if (!customValidators.confirmPassword && valuesToValidate.password && valuesToValidate.confirmPassword !== undefined) {
            if (valuesToValidate.password !== valuesToValidate.confirmPassword) {
                validationErrors.confirmPassword = 'Passwords do not match';
            }
        }
        
        return validationErrors;
    };
    
    // Reset form to initial values
    const resetForm = () => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    };

    // Set a specific field value
    const setFieldValue = (name, value) => {
        setValues(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Handle input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues(prevValues => ({
            ...prevValues,
            [name]: value
        }));
    };
    
    // Handle input blur
    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched(prevTouched => ({
            ...prevTouched,
            [name]: true
        }));
    };
    
    // Validate form when values or touched fields change
    useEffect(() => {
        // Always run validation if we have validation rules, custom validators, or password confirmation
        const hasPasswordConfirmation = values.password !== undefined && values.confirmPassword !== undefined;
        if (validateForm || Object.keys(customValidators).length > 0 || hasPasswordConfirmation) {
            const validationErrors = runValidation(values);
            setErrors(validationErrors);
        }
    // Remove validateForm from dependencies to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values, touched]);
    
    // Handle form submission
    const handleSubmit = async (eventOrHandler) => {
        // Handle preventDefault if this is an event object
        if (eventOrHandler && typeof eventOrHandler.preventDefault === 'function') {
            eventOrHandler.preventDefault();
        }
        
        // Determine submit handler: if eventOrHandler is a function, use it, otherwise use onSubmit
        let submitHandler;
        if (typeof eventOrHandler === 'function') {
            submitHandler = eventOrHandler;
        } else {
            submitHandler = onSubmit;
        }
        
        setTouched(
            Object.keys(values).reduce((acc, key) => {
                acc[key] = true;
                return acc;
            }, {})
        );
        
        const validationErrors = runValidation(values);
        setErrors(validationErrors);
        
        if (Object.keys(validationErrors).length === 0 && submitHandler && typeof submitHandler === 'function') {
            setIsSubmitting(true);
            try {
                const result = await submitHandler(values);
                return result;
            } catch (error) {
                logError('Form submission error:', error);
                setErrors(prevErrors => ({
                    ...prevErrors,
                    form: error.message || 'An error occurred'
                }));
                // Don't re-throw the error to allow graceful handling
                return null;
            } finally {
                setIsSubmitting(false);
            }
        }
    };
    
    return {
        values,
        errors,
        touched,
        isSubmitting,
        handleChange,
        handleBlur,
        handleSubmit,
        resetForm,
        setValues,
        setFieldValue
    };
};

/**
 * Custom hook for API data fetching with loading and error states
 * @param {Function} fetchFunction - Function that returns a promise
 * @param {Array} dependencies - Dependencies array for useEffect
 * @returns {Object} Data, loading state, error, and refetch function
 */
export const useApiData = (fetchFunction, dependencies = []) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await fetchFunction();
            setData(result);
            return result;
        } catch (err) {
            const errorMessage = err.message || 'An error occurred';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    };
    
    const refetch = () => fetchData(true);
    
    useEffect(() => {
        fetchData(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
    
    return { data, loading, error, refetch };
};

/**
 * Custom hook for handling local storage
 * @param {string} key - Local storage key
 * @param {any} initialValue - Initial value
 * @returns {Array} Current value and setter function
 */
export const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            logError('Failed to read from localStorage:', error);
            return initialValue;
        }
    });
    
    // Handle key changes (not initial mount)
    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        
        try {
            const item = window.localStorage.getItem(key);
            setStoredValue(item ? JSON.parse(item) : initialValue);
        } catch (error) {
            logError('Failed to refresh localStorage cache:', error);
            setStoredValue(initialValue);
        }
    // Only depend on key changes, not initialValue to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
    
    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            const jsonString = JSON.stringify(valueToStore);
            const parsedValue = JSON.parse(jsonString); // Simulate JSON roundtrip
            setStoredValue(parsedValue);
            window.localStorage.setItem(key, jsonString);
        } catch (error) {
            logError('Failed to persist localStorage value:', error);
        }
    };
    
    return [storedValue, setValue];
};

/**
 * Custom hook for toggling boolean state
 * @param {boolean} initialState - Initial state
 * @returns {Array} Current state and toggle function
 */
export function useToggle(initialState) {
    // Store the initial value as-is, defaulting to false only if no argument is provided
    const [state, setState] = useState(() => {
        return arguments.length === 0 ? false : initialState;
    });
    
    const toggle = () => setState(prevState => !prevState);
    
    return [state, toggle];
}