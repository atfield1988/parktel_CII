import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          if (decodedToken.exp * 1000 > Date.now()) {
            try {
              const response = await api.get('/mypage/me');
              setUser(response.data);
            } catch (err) {
              localStorage.removeItem('token');
              setUser(null);
            }
          } else {
            localStorage.removeItem('token');
            setUser(null);
          }
        } catch (err) {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (phone_number, password) => {
    const response = await api.post('/auth/login', { phone_number, password });
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    const userResponse = await api.get('/mypage/me');
    setUser(userResponse.data);
  };

  const adminLogin = async (username, password) => {
    const response = await api.post('/auth/super-admin-login', { username, password });
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    const userResponse = await api.get('/mypage/me');
    setUser(userResponse.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, adminLogin, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
