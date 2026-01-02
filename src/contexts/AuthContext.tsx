import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole, LoginFormData, RegisterFormData } from '@/types';
import {
  getSession,
  saveSession,
  clearSession,
  getUserByEmail,
  createUser,
  encryptPassword,
  verifyPassword,
  initializeStorage,
  sanitizeInput,
  isValidEmail,
} from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginFormData) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterFormData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize storage and check for existing session
  useEffect(() => {
    initializeStorage();
    const session = getSession();
    if (session?.user) {
      setUser(session.user);
    }
    setIsLoading(false);
  }, []);

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

      // Verify password
      if (!verifyPassword(password, foundUser.password)) {
        return { success: false, error: 'Contraseña incorrecta' };
      }

      // Save session and update state
      saveSession(foundUser);
      setUser(foundUser);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  }, []);

  const register = useCallback(async (data: RegisterFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      // Sanitize inputs
      const nombre = sanitizeInput(data.nombre);
      const email = sanitizeInput(data.email);
      const password = data.password;
      const confirmPassword = data.confirmPassword;

      // Validations
      if (!nombre || nombre.length < 2) {
        return { success: false, error: 'El nombre debe tener al menos 2 caracteres' };
      }

      if (!isValidEmail(email)) {
        return { success: false, error: 'Formato de email inválido' };
      }

      if (password.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }

      if (password !== confirmPassword) {
        return { success: false, error: 'Las contraseñas no coinciden' };
      }

      // Check if user exists
      if (getUserByEmail(email)) {
        return { success: false, error: 'El email ya está registrado' };
      }

      // Create user
      const encryptedPassword = encryptPassword(password);
      const newUser = createUser({
        nombre,
        email,
        password: encryptedPassword,
        rol: data.rol,
      });

      if (!newUser) {
        return { success: false, error: 'Error al crear el usuario' };
      }

      // Auto-login after registration
      saveSession(newUser);
      setUser(newUser);

      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Error al registrar usuario' };
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.rol);
    }
    return user.rol === role;
  }, [user]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    hasRole,
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
