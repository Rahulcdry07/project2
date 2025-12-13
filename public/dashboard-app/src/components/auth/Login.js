import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { setAuthData } from '../../utils/auth';
import { isValidEmail } from '../../utils/helpers';
import ErrorDisplay from '../common/ErrorDisplay';
import { ToastContainer } from '../common/Toast';
import { useToast } from '../../hooks/useToast';

const Login = () => {
  const navigate = useNavigate();
  const { toasts, removeToast, showSuccess, showInfo } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time validation
    validateField(name, value);
  };

  const validateField = (name, value) => {
    const errors = { ...fieldErrors };

    if (name === 'email') {
      if (!value) {
        errors.email = 'Email is required';
      } else if (!isValidEmail(value)) {
        errors.email = 'Please enter a valid email address';
      } else {
        delete errors.email;
      }
    }

    if (name === 'password') {
      if (!value) {
        errors.password = 'Password is required';
      } else if (value.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      } else {
        delete errors.password;
      }
    }

    setFieldErrors(errors);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Validate all fields before submission
    const errors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      setAuthData(response.user, response.token);
      showSuccess('Login successful! Redirecting to dashboard...');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show info message from registration if present
  React.useEffect(() => {
    const message = location.state?.message;
    if (message) {
      showInfo(message, 7000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInfo]);

  const handleRetry = () => {
    setError('');
    // Clear form or reset state if needed
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} position="top-right" />
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="card">
            <div className="card-body">
              <h1 className="card-title text-center mb-4">Login</h1>

              <ErrorDisplay error={error} onRetry={handleRetry} retryText="Clear Error" />

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    className={`form-control ${fieldErrors.email ? 'is-invalid' : formData.email && !fieldErrors.email ? 'is-valid' : ''}`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => validateField('email', formData.email)}
                    required
                    aria-describedby="emailError"
                  />
                  {fieldErrors.email && (
                    <div className="invalid-feedback" id="emailError">
                      {fieldErrors.email}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    className={`form-control ${fieldErrors.password ? 'is-invalid' : formData.password && !fieldErrors.password ? 'is-valid' : ''}`}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => validateField('password', formData.password)}
                    required
                    aria-describedby="passwordError"
                  />
                  {fieldErrors.password && (
                    <div className="invalid-feedback" id="passwordError">
                      {fieldErrors.password}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isLoading || Object.keys(fieldErrors).length > 0}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              </form>

              <div className="text-center mt-3">
                <p>
                  Don&apos;t have an account? <Link to="/register">Register here</Link>
                </p>
                <p>
                  <Link to="/forgot-password">Forgot your password?</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
