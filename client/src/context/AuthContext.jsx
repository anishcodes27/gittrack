import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [isAuthenticated, setIsAuth]  = useState(false);
  const [isDemoMode, setIsDemoMode]   = useState(false);

  // Restore session on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await client.get('/auth/me');
        if (data.success && data.user) {
          setUser(data.user);
          setIsAuth(true);
        }
      } catch {
        // 401 or network error — user is not authenticated
        setUser(null);
        setIsAuth(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for 401 events from axios interceptor
    const handleUnauth = () => {
      setUser(null);
      setIsAuth(false);
    };
    window.addEventListener('auth:unauthorized', handleUnauth);
    return () => window.removeEventListener('auth:unauthorized', handleUnauth);
  }, []);

  const login = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/github`;
  };

  const logout = async () => {
    try {
      await client.post('/auth/logout');
    } catch { /* ignore */ }
    setUser(null);
    setIsAuth(false);
    setIsDemoMode(false);
  };

  const enterDemoMode = () => {
    setIsDemoMode(true);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, isDemoMode, login, logout, enterDemoMode, exitDemoMode, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
