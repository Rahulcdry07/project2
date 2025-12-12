import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { isValidEmail, validatePassword } from '../../utils/helpers';
import { ToastContainer } from '../common/Toast';
import { useToast } from '../../hooks/useToast';

const Register = () => {
  const navigate = useNavigate();
  const { toasts, removeToast, showSuccess } = useToast();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ level: 0, text: '', color: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Real-time validation
    validateField(name, value);
    
    // Calculate password strength
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength({ level: 0, text: '', color: '' });
      return;
    }

    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    // Calculate strength score
    if (checks.length) strength += 1;
    if (checks.lowercase) strength += 1;
    if (checks.uppercase) strength += 1;
    if (checks.number) strength += 1;
    if (checks.special) strength += 1;

    // Determine strength level
    let level, text, color;
    if (strength <= 2) {
      level = 1;
      text = 'Weak';
      color = 'danger';
    } else if (strength === 3) {
      level = 2;
      text = 'Fair';
      color = 'warning';
    } else if (strength === 4) {
      level = 3;
      text = 'Good';
      color = 'info';
    } else {
      level = 4;
      text = 'Strong';
      color = 'success';
    }

    setPasswordStrength({ level, text, color, checks });
  };

  const validateField = (name, value) => {
    const errors = { ...fieldErrors };
    
    if (name === 'username') {
      if (!value) {
        errors.username = 'Username is required';
      } else if (value.length < 3) {
        errors.username = 'Username must be at least 3 characters';
      } else if (value.length > 20) {
        errors.username = 'Username must be less than 20 characters';
      } else {
        delete errors.username;
      }
    }
    
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
      const validation = validatePassword(value);
      if (!validation.isValid) {
        errors.password = validation.message;
      } else {
        delete errors.password;
        // Re-validate confirm password if it has a value
        if (formData.confirmPassword) {
          validateField('confirmPassword', formData.confirmPassword);
        }
      }
    }
    
    if (name === 'confirmPassword') {
      if (!value) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (value !== formData.password) {
        errors.confirmPassword = 'Passwords do not match';
      } else {
        delete errors.confirmPassword;
      }
    }
    
    setFieldErrors(errors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    validateField('username', formData.username);
    validateField('email', formData.email);
    validateField('password', formData.password);
    validateField('confirmPassword', formData.confirmPassword);
    
    if (Object.keys(fieldErrors).length > 0) {
      return;
    }
    
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      showSuccess('Registration successful! Check your email to verify.');
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Registration successful! Please check your email to verify your account.' }
        });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} position="top-right" />
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="card">
            <div className="card-body">
              <h1 className="card-title text-center mb-4">Register</h1>
            
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <input
                  type="text"
                  className={`form-control ${fieldErrors.username ? 'is-invalid' : formData.username && !fieldErrors.username ? 'is-valid' : ''}`}
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={() => validateField('username', formData.username)}
                  required
                  aria-describedby="usernameError"
                />
                {fieldErrors.username && (
                  <div className="invalid-feedback" id="usernameError">
                    {fieldErrors.username}
                  </div>
                )}
              </div>

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
                  aria-describedby="passwordError passwordHelp passwordStrength"
                />
                {fieldErrors.password && (
                  <div className="invalid-feedback" id="passwordError">
                    {fieldErrors.password}
                  </div>
                )}
                {!fieldErrors.password && formData.password && (
                  <div className="form-text text-success" id="passwordHelp">
                    ✓ Password meets requirements
                  </div>
                )}
                {formData.password && passwordStrength.text && (
                  <div className="mt-2" id="passwordStrength">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <small className="text-muted">Password Strength:</small>
                      <small className={`fw-bold text-${passwordStrength.color}`}>
                        {passwordStrength.text}
                      </small>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div
                        className={`progress-bar bg-${passwordStrength.color}`}
                        role="progressbar"
                        style={{ width: `${(passwordStrength.level / 4) * 100}%` }}
                        aria-valuenow={passwordStrength.level}
                        aria-valuemin="0"
                        aria-valuemax="4"
                      />
                    </div>
                    {passwordStrength.checks && (
                      <div className="mt-2">
                        <small className="text-muted d-block">Requirements:</small>
                        <small className={passwordStrength.checks.length ? 'text-success' : 'text-muted'}>
                          {passwordStrength.checks.length ? '✓' : '○'} At least 8 characters
                        </small><br />
                        <small className={passwordStrength.checks.uppercase ? 'text-success' : 'text-muted'}>
                          {passwordStrength.checks.uppercase ? '✓' : '○'} Uppercase letter
                        </small><br />
                        <small className={passwordStrength.checks.lowercase ? 'text-success' : 'text-muted'}>
                          {passwordStrength.checks.lowercase ? '✓' : '○'} Lowercase letter
                        </small><br />
                        <small className={passwordStrength.checks.number ? 'text-success' : 'text-muted'}>
                          {passwordStrength.checks.number ? '✓' : '○'} Number
                        </small><br />
                        <small className={passwordStrength.checks.special ? 'text-success' : 'text-muted'}>
                          {passwordStrength.checks.special ? '✓' : '○'} Special character (optional for strong)
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className={`form-control ${fieldErrors.confirmPassword ? 'is-invalid' : formData.confirmPassword && !fieldErrors.confirmPassword ? 'is-valid' : ''}`}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => validateField('confirmPassword', formData.confirmPassword)}
                  required
                  aria-describedby="confirmPasswordError"
                />
                {fieldErrors.confirmPassword && (
                  <div className="invalid-feedback" id="confirmPasswordError">
                    {fieldErrors.confirmPassword}
                  </div>
                )}
                {!fieldErrors.confirmPassword && formData.confirmPassword && (
                  <div className="form-text text-success">
                    ✓ Passwords match
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
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating account...
                  </>
                ) : 'Register'}
              </button>
            </form>

            <div className="text-center mt-3">
              <p>
                Already have an account?{' '}
                <Link to="/login">Login here</Link>
              </p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;