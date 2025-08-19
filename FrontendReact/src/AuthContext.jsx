//authContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

const checkAuth = async () => {
  setLoading(true);
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user`, {
      credentials: 'include', // Ensures cookies are sent
    });
    
    if (response.ok) {
      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } else {
      console.warn('Auth check failed:', response.status);
      // Only clear if 401
      if (response.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
      }
    }
  } catch (error) {
    console.error('Auth check error:', error);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (token) {
    localStorage.setItem('token', token); // Save token
  }
  };

  const logout = async () => {
  try {
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
};


  const value = { 
    user, 
    loading, 
    login, 
    logout, 
    checkAuth 
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
