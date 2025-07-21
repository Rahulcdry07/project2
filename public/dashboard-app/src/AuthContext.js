import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import TokenManager from './utils/tokenManager';

function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || !obj1 || !obj2) return false;
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (let key of keys1) {
    if (!keys2.includes(key) || obj1[key] !== obj2[key]) return false;
  }
  return true;
}

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = TokenManager.getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoggedIn(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/profile');
      const data = await response.json();
      setIsLoading(false);
      if (response.ok) {
        setIsLoggedIn(true);
        setUser(prevUser => (deepEqual(prevUser, data) ? prevUser : data));
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (error) {
      setIsLoggedIn(false);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const contextValue = useMemo(() => ({
    user,
    isLoggedIn,
    isLoading,
    setUser,
    setIsLoggedIn,
    refreshUser
  }), [user, isLoggedIn, isLoading, refreshUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 