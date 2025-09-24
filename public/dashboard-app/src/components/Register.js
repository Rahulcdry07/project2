import React from 'react';
import RegisterComponent from './auth/Register';

/**
 * Register component that serves as a container for registration functionality
 * This component is kept for backward compatibility and now just imports
 * the Register component from the auth directory
 */
const Register = () => {
    return <RegisterComponent />;
};

export default Register;