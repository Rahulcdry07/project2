import React from 'react';
import LoginComponent from './auth/Login';

/**
 * Login component that serves as a container for login functionality
 * This component is kept for backward compatibility and now just imports
 * the Login component from the auth directory
 */
const Login = () => {
    return <LoginComponent />;
};

export default Login;