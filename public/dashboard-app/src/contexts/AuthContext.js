import React, { createContext, useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getToken, setAuthData, clearAuthData, getCurrentUser } from '../utils/auth';
import { authAPI } from '../services/api';

// Create the authentication context
const AuthContext = createContext();

/**
 * Auth provider component that provides authentication state and methods
 */
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Initialize auth state from localStorage on mount
    useEffect(() => {
        const initializeAuth = () => {
            try {
                const token = getToken();
                const user = getCurrentUser();
                
                if (token && user) {
                    setCurrentUser(user);
                }
            } catch (err) {
                // console.error('Failed to initialize auth state:', err);
                setError('Failed to initialize authentication');
            } finally {
                setLoading(false);
            }
        };
        
        initializeAuth();
    }, []);
    
    /**
     * Login the user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise} Promise resolving to the user data
     */
    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await authAPI.login(email, password);
            setAuthData(response.user, response.token);
            setCurrentUser(response.user);
            return response.user;
        } catch (err) {
            setError(err.message || 'Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };
    
    /**
     * Register a new user
     * @param {string} username - Username
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise} Promise resolving to the registration response
     */
    const register = async (username, email, password) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await authAPI.register(username, email, password);
            return response;
        } catch (err) {
            setError(err.message || 'Registration failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };
    
    /**
     * Logout the user
     */
    const logout = () => {
        clearAuthData();
        setCurrentUser(null);
    };
    
    /**
     * Update the current user data
     * @param {Object} userData - Updated user data
     */
    const updateUser = (userData) => {
        if (currentUser && userData) {
            const updatedUser = { ...currentUser, ...userData };
            setAuthData(updatedUser, getToken());
            setCurrentUser(updatedUser);
        }
    };
    
    // Value object to be provided to consumers
    const value = {
        currentUser,
        loading,
        error,
        login,
        register,
        logout,
        updateUser
    };
    
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Custom hook for using the auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    
    return context;
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export default AuthContext;