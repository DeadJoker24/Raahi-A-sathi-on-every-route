import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, userService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on app load / page refresh
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('raahi_token');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        setToken(storedToken);
        // Validate token against backend /api/users/me
        const response = await userService.getCurrentUser();
        if (response.success && response.data.user) {
          setUser(response.data.user);
        } else {
          // Token invalid or user no longer exists
          logout();
        }
      } catch (err) {
        console.warn('Session restoration failed:', err.message);
        // Clear invalid token from localStorage
        localStorage.removeItem('raahi_token');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const { token: receivedToken, user: receivedUser } = response.data;

    // Persist in localStorage for refresh resilience
    localStorage.setItem('raahi_token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);

    return receivedUser;
  };

  // Register handler
  const register = async (name, email, password, role) => {
    return await authService.register(name, email, password, role);
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('raahi_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
