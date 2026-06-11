import api from "@/lib/apiClient";
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("cosmoai_token");
    if (token) {
      checkUserAuth();
    } else {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await api.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      localStorage.removeItem("cosmoai_token");
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const register = async (email, username, password) => {
    const userData = await api.auth.register(email, username, password);
    setUser(userData);
    setIsAuthenticated(true);
    setAuthError(null);
    return userData;
  };

  const login = async (username, password) => {
    const userData = await api.auth.login(username, password);
    setUser(userData);
    setIsAuthenticated(true);
    setAuthError(null);
    return userData;
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = "/login";
  };

  const navigateToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      authChecked,
      appPublicSettings: null,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState: checkUserAuth,
      login,
      register,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};