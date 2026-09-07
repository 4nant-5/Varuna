import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      try {
        const token = localStorage.getItem('varuna_token');
        if (token) {
          // Validate token with backend
          const data = await api.validateToken(token);
          if (data && data.user) {
            setUser(data.user);
          } else {
            // Token invalid — clear
            localStorage.removeItem('varuna_token');
            localStorage.removeItem('varuna_user');
          }
        }
      } catch (e) {
        console.error('Session validation failed', e);
        localStorage.removeItem('varuna_token');
        localStorage.removeItem('varuna_user');
      } finally {
        setLoading(false);
      }
    };
    validateSession();
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    if (data.token) {
      localStorage.setItem('varuna_token', data.token);
      localStorage.setItem('varuna_user', JSON.stringify(data.user));
    }
    setUser(data.user);
    return data;
  };

  const register = async (name, email, organization, password) => {
    const data = await api.register(name, email, organization, password);
    if (data.token) {
      localStorage.setItem('varuna_token', data.token);
      localStorage.setItem('varuna_user', JSON.stringify(data.user));
    }
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('varuna_token');
    localStorage.removeItem('varuna_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
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
