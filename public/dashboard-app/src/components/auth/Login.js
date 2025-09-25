import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { setAuthData } from '../../utils/auth';
import { useForm } from '../../hooks/useForm';
import FormInput, { Alert, Card } from '../common/FormComponents';
import { isValidEmail } from '../../utils/helpers';

/**
 * Login component
 */
const Login = () => {
    const navigate = useNavigate();
    const [generalError, setGeneralError] = useState(null);
    
    // Form validation function
    const validateForm = (values) => {
        const errors = {};
        
        if (!values.email) {
            errors.email = 'Email is required';
        } else if (!isValidEmail(values.email)) {
            errors.email = 'Invalid email format';
        }
        
        if (!values.password) {
            errors.password = 'Password is required';
        }
        
        return errors;
    };
    
    // Form hook
    const { 
        values, 
        errors, 
        touched, 
        isSubmitting, 
        handleChange, 
        handleBlur, 
        handleSubmit 
    } = useForm(
        { email: '', password: '' },
        validateForm
    );
    
    // Form submission handler
    const onSubmit = async (formValues) => {
        try {
            setGeneralError(null);
            const response = await authAPI.login(formValues.email, formValues.password);
            setAuthData(response.user, response.token);
            navigate('/dashboard');
        } catch (error) {
            setGeneralError(error.message || 'Failed to login. Please check your credentials.');
        }
    };
    
    return (
        <div className="container">
            <div className="row justify-content-center mt-5">
                <div className="col-md-6 col-lg-5">
                    <Card title="Login">
                        {generalError && (
                            <Alert 
                                message={generalError} 
                                onClose={() => setGeneralError(null)} 
                            />
                        )}
                        
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit(onSubmit);
                        }}>
                            <FormInput
                                type="email"
                                name="email"
                                label="Email"
                                value={values.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={errors.email}
                                touched={touched.email}
                                required
                                autoComplete="email"
                            />
                            
                            <FormInput
                                type="password"
                                name="password"
                                label="Password"
                                value={values.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={errors.password}
                                touched={touched.password}
                                required
                                autoComplete="current-password"
                            />
                            
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="form-check">
                                    <input 
                                        type="checkbox" 
                                        className="form-check-input" 
                                        id="rememberMe" 
                                    />
                                    <label className="form-check-label" htmlFor="rememberMe">
                                        Remember me
                                    </label>
                                </div>
                                <Link to="/forgot-password" className="text-decoration-none">
                                    Forgot password?
                                </Link>
                            </div>
                            
                            <button 
                                type="submit" 
                                className="btn btn-primary w-100" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Logging in...
                                    </>
                                ) : (
                                    'Login'
                                )}
                            </button>
                        </form>
                        
                        <div className="mt-3 text-center">
                            <p>
                                Don&apos;t have an account?{' '} <Link to="/register" className="text-decoration-none">Register</Link>
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Login;