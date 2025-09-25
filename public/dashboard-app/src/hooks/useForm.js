import { useState, useEffect } from 'react';

/**
 * Custom hook for managing form state with validation
 * @param {Object} initialValues - Initial form values
 * @param {Function} validateForm - Validation function
 * @returns {Object} Form state and handlers
 */
export const useForm = (initialValues, validateForm) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
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
        setValues({
            ...values,
            [name]: value
        });
    };
    
    // Handle input blur
    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched({
            ...touched,
            [name]: true
        });
    };
    
    // Validate form when values or touched fields change
    useEffect(() => {
        // Only run validation if there are touched fields and a validation function exists
        if (Object.keys(touched).length > 0 && validateForm) {
            const validationErrors = validateForm(values);
            setErrors(validationErrors);
        }
    // Remove validateForm from dependencies to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values, touched]);
    
    // Handle form submission
    const handleSubmit = async (onSubmit) => {
        setTouched(
            Object.keys(values).reduce((acc, key) => {
                acc[key] = true;
                return acc;
            }, {})
        );
        
        const validationErrors = validateForm ? validateForm(values) : {};
        setErrors(validationErrors);
        
        if (Object.keys(validationErrors).length === 0) {
            setIsSubmitting(true);
            try {
                await onSubmit(values);
            } catch (error) {
                console.error('Form submission error:', error);
                setErrors({
                    ...validationErrors,
                    form: error.message || 'An error occurred'
                });
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
            setError(err.message || 'An error occurred');
            return null;
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
    
    return { data, loading, error, refetch: fetchData };
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
            console.error(error);
            return initialValue;
        }
    });
    
    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };
    
    return [storedValue, setValue];
};

/**
 * Custom hook for toggling boolean state
 * @param {boolean} initialState - Initial state
 * @returns {Array} Current state and toggle function
 */
export const useToggle = (initialState = false) => {
    const [state, setState] = useState(initialState);
    const toggle = () => setState(prevState => !prevState);
    
    return [state, toggle];
};