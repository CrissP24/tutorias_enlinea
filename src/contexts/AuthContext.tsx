import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole, LoginFormData } from '@/types';
import {
  getSession,
  saveSession,
  clearSession,
  getUserByEmail,
  getUserById,
  updateUser,
  encryptPassword,
  verifyPassword,
  initializeStorage,
  sanitizeInput,
  isValidEmail,
  updateSessionUser,
} from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requiresPasswordChange: boolean;
  login: (data: LoginFormData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  updateCurrentUser: (updates: Partial<User>) => void;
  completePasswordChange: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  // Initialize storage and check for existing session
  useEffect(() => {
    initializeStorage();
    const session = getSession();
    if (session?.user) {
      // Refresh user data from storage
      const freshUser = getUserById(session.user.id);
      if (freshUser && freshUser.estado === 'activo') {
        setUser(freshUser);
        setRequiresPasswordChange(freshUser.forcePasswordChange);
      } else {
        clearSession();
      }
    }
    setIsLoading(false);
  }, []);

  const refreshUser = useCallback(() => {
    if (user) {
      const freshUser = getUserById(user.id);
      if (freshUser) {
        setUser(freshUser);
        updateSessionUser(freshUser);
      }
    }
  }, [user]);

  const login = useCallback(async (data: LoginFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      // Sanitize inputs
      const email = sanitizeInput(data.email);
      const password = data.password; // Don't sanitize password

      // Validate email
      if (!isValidEmail(email)) {
        return { success: false, error: 'Formato de email inválido' };
      }

      // Find user
      const foundUser = getUserByEmail(email);
      if (!foundUser) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      // Check if user is active
      if (foundUser.estado === 'inactivo') {
        return { success: false, error: 'Usuario inactivo. Contacte al administrador.' };
      }

      // Verify password
      if (!verifyPassword(password, foundUser.password)) {
        return { success: false, error: 'Contraseña incorrecta' };
      }

      // Save session and update state
      saveSession(foundUser);
      setUser(foundUser);
      setRequiresPasswordChange(foundUser.forcePasswordChange);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setRequiresPasswordChange(false);
  }, []);

  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.rol);
    }
    return user.rol === role;
  }, [user]);

  const updateCurrentUser = useCallback((updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      updateSessionUser(updatedUser);
    }
  }, [user]);

  const completePasswordChange = useCallback(() => {
    if (user) {
      const updatedUser = updateUser(user.id, { forcePasswordChange: false });
      if (updatedUser) {
        setUser(updatedUser);
        updateSessionUser(updatedUser);
        setRequiresPasswordChange(false);
      }
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    requiresPasswordChange,
    login,
    logout,
    hasRole,
    updateCurrentUser,
    completePasswordChange,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
