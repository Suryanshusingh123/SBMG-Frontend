import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token and user data
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('userRole');
    
    if (storedToken && storedUser && storedRole) {
      setUser(JSON.parse(storedUser));
      setRole(storedRole);
    }
    setLoading(false);
  }, []);

  const login = async (username, password, rememberMe = false) => {
    try {
      // Call login API
      const loginResponse = await authAPI.login({ username, password });
      const { access_token } = loginResponse.data;
      
      // Store token
      localStorage.setItem('access_token', access_token);
      
      // Call /auth/me to get user details
      const meResponse = await authAPI.getMe();
      const userData = meResponse.data;
      
      // Define allowed roles and their mappings
      const allowedRoles = ['worker', 'vdo', 'admin', 'bdo', 'ceo'];
      const roleMappings = {
        'worker': 'supervisor',
        'vdo': 'vdo', 
        'admin': 'smd',
        'bdo': 'bdo',
        'ceo': 'ceo'
      };
      
      // Check if user role is allowed
      if (!userData.role || !allowedRoles.includes(userData.role.toLowerCase())) {
        localStorage.removeItem('access_token');
        throw new Error('Access denied. Only authorized roles (Worker, VDO, Admin, BDO, CEO) are allowed.');
      }
      
      // Map role to our internal role system
      const userRole = userData.role.toLowerCase();
      const mappedRole = roleMappings[userRole];
      
      // Store user data
      setUser(userData);
      setRole(mappedRole);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userRole', mappedRole);
      
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const message = error.response.data?.detail || error.response.data?.message || 'Login failed';
        throw new Error(message);
      } else if (error.request) {
        // Network error
        throw new Error('Network error. Please check your connection.');
      } else {
        // Other error
        throw new Error(error.message || 'Login failed. Please try again.');
      }
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('access_token');
    localStorage.removeItem('rememberMe');
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

