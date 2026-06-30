import { createContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, register as registerApi, getMe } from '../services/authService';
import api from '../api/axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await loginApi(email, password);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const register = async ({ name, email, password }) => {
    const res = await registerApi({ name, email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const updateProfile = async ({ name, email }) => {
    setUser((prev) => ({ ...prev, name, email }));
    return { success: true };
  };

  const getAllUsers = useCallback(async () => {
    try {
      const res = await api.get('/auth/users');
      return res.data;
    } catch {
      return [];
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, getAllUsers }}>
      {children}
    </AuthContext.Provider>
  );
}
