import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [isAuthenticated, setIsAuth]  = useState(false);

  // Restore session on page load
  useEffect(() => {
    const checkAuth = async () => {
      // Check for token in URL (from OAuth redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');
      
      if (tokenFromUrl) {
        localStorage.setItem('gittrack_token', tokenFromUrl);
        // Clean the URL so the token isn't visible
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const token = localStorage.getItem('gittrack_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await client.get('/auth/me');
        if (data.success && data.user) {
          setUser(data.user);
          setIsAuth(true);
        }
      } catch {
        localStorage.removeItem('gittrack_token');
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
    localStorage.removeItem('gittrack_token');
    setUser(null);
    setIsAuth(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
