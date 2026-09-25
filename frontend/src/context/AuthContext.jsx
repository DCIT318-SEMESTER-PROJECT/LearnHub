import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser } from '../api/authAPI';

const AuthContext = createContext();

// ✅ Capitalize helper
const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const normalizeUser = (userData) => {
  if (!userData) return null;
  return {
    ...userData,
    firstName: capitalize(userData.firstName),
    lastName: capitalize(userData.lastName)
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      const normalized = normalizeUser(currentUser);
      setUser(normalized);
      setIsAuthenticated(true);
      // Update localStorage with normalized version
      localStorage.setItem('user', JSON.stringify(normalized));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    const normalized = normalizeUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalized));
    setUser(normalized);
    setIsAuthenticated(true);
    window.dispatchEvent(new Event('userLoggedIn'));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('userLoggedOut'));
  };

  const updateUser = (userData) => {
    const updatedUser = normalizeUser({ ...user, ...userData });
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    window.dispatchEvent(new Event('userLoggedIn'));
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      loading,
      isAuthenticated,
      login,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}