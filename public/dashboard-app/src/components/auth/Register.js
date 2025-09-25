import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from '../../hooks/useForm';
import { authAPI } from '../../services/api';
import FormInput, { Alert, Card } from '../common/FormComponents';
import { isValidEmail, validatePassword } from '../../utils/helpers';

/**
 * Register component
 */
const Register = () => {
    // const navigate = useNavigate();
    const [generalError, setGeneralError] = useState(null);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    
    // Form validation function
    const validateForm = (values) => {
        const errors = {};
        
        if (!values.username) {
            errors.username = 'Username is required';
        } else if (values.username.length < 3) {
            errors.username = 'Username must be at least 3 characters';
        }
        
        if (!values.email) {
            errors.email = 'Email is required';
        } else if (!isValidEmail(values.email)) {
            errors.email = 'Invalid email format';
        }
        
        if (!values.password) {
            errors.password = 'Password is required';
        } else {
            const passwordValidation = validatePassword(values.password);
            if (!passwordValidation.isValid) {
                errors.password = passwordValidation.message;
            }
        }
        
        if (!values.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (values.password !== values.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
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
        { username: '', email: '', password: '', confirmPassword: '' },
        validateForm
    );
    
    // Form submission handler
    const onSubmit = async (formValues) => {
        try {
            setGeneralError(null);
            await authAPI.register(
                formValues.username, 
                formValues.email, 
                formValues.password
            );
            setRegistrationSuccess(true);
        } catch (error) {
            setGeneralError(error.message || 'Registration failed. Please try again.');
        }
    };
    
    // If registration is successful, show success message
    if (registrationSuccess) {
        return (
            <div className="container">
                <div className="row justify-content-center mt-5">
                    <div className="col-md-6 col-lg-5">
                        <Card title="Registration Successful">
                            <div className="alert alert-success">
                                <h5 className="alert-heading">Success!</h5>
                                <p>Your account has been created successfully. Please check your email to verify your account.</p>
                            </div>
                            <div className="text-center mt-3">
                                <Link to="/login" className="btn btn-primary">
                                    Go to Login
                                </Link>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="container">
            <div className="row justify-content-center mt-5">
                <div className="col-md-6 col-lg-5">
                    <Card title="Register">
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
                                type="text"
                                name="username"
                                label="Username"
                                value={values.username}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={errors.username}
                                touched={touched.username}
                                required
                                autoComplete="username"
                            />
                            
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
                                autoComplete="new-password"
                            />
                            
                            <FormInput
                                type="password"
                                name="confirmPassword"
                                label="Confirm Password"
                                value={values.confirmPassword}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={errors.confirmPassword}
                                touched={touched.confirmPassword}
                                required
                                autoComplete="new-password"
                            />
                            
                            <div className="form-check mb-3">
                                <input 
                                    type="checkbox" 
                                    className="form-check-input" 
                                    id="termsCheck" 
                                    required 
                                />
                                <label className="form-check-label" htmlFor="termsCheck">
                                    I agree to the <button type="button" className="btn btn-link text-decoration-none p-0">Terms and Conditions</button>
                                </label>
                            </div>
                            
                            <button 
                                type="submit" 
                                className="btn btn-primary w-100" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Registering...
                                    </>
                                ) : (
                                    'Register'
                                )}
                            </button>
                        </form>
                        
                        <div className="mt-3 text-center">
                            <p>
                                Already have an account? <Link to="/login" className="text-decoration-none">Login</Link>
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Register;