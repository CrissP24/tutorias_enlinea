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
  updateSessionActiveRole,
} from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  activeRole: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requiresPasswordChange: boolean;
  needsRoleSelection: boolean; // Si el usuario tiene múltiples roles y necesita seleccionar uno
  login: (data: LoginFormData) => Promise<{ success: boolean; error?: string; needsRoleSelection?: boolean }>;
  selectRole: (role: UserRole) => void;
  logout: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  updateCurrentUser: (updates: Partial<User>) => void;
  completePasswordChange: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);

  // Helper function to get user roles as array
  const getUserRoles = (user: User): UserRole[] => {
    return Array.isArray(user.rol) ? user.rol : [user.rol];
  };

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
        
        // Check if user has multiple roles
        const userRoles = getUserRoles(freshUser);
        if (userRoles.length > 1) {
          // If session has activeRole and it's still valid, use it
          if (session.activeRole && userRoles.includes(session.activeRole)) {
            setActiveRole(session.activeRole);
            setNeedsRoleSelection(false);
          } else {
            // Need to select a role
            setNeedsRoleSelection(true);
            setActiveRole(null);
          }
        } else {
          // Single role user
          setActiveRole(userRoles[0]);
          setNeedsRoleSelection(false);
        }
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
        
        // Update activeRole if needed
        const userRoles = getUserRoles(freshUser);
        if (userRoles.length > 1) {
          const session = getSession();
          if (session?.activeRole && userRoles.includes(session.activeRole)) {
            setActiveRole(session.activeRole);
          } else {
            setNeedsRoleSelection(true);
            setActiveRole(null);
          }
        } else {
          setActiveRole(userRoles[0]);
          setNeedsRoleSelection(false);
        }
      }
    }
  }, [user]);

  const login = useCallback(async (data: LoginFormData): Promise<{ success: boolean; error?: string; needsRoleSelection?: boolean }> => {
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

      // Check if user has multiple roles
      const userRoles = getUserRoles(foundUser);
      const hasMultipleRoles = userRoles.length > 1;

      if (hasMultipleRoles) {
        // If user has coordinador role, automatically redirect to coordinador dashboard
        if (userRoles.includes('coordinador')) {
          saveSession(foundUser, 'coordinador');
          setUser(foundUser);
          setActiveRole('coordinador');
          setRequiresPasswordChange(foundUser.forcePasswordChange);
          setNeedsRoleSelection(false);
          return { success: true, needsRoleSelection: false };
        }
        // Otherwise, show role selection
        saveSession(foundUser);
        setUser(foundUser);
        setRequiresPasswordChange(foundUser.forcePasswordChange);
        setNeedsRoleSelection(true);
        setActiveRole(null);
        return { success: true, needsRoleSelection: true };
      } else {
        // Single role user
        const role = userRoles[0];
        saveSession(foundUser, role);
        setUser(foundUser);
        setActiveRole(role);
        setRequiresPasswordChange(foundUser.forcePasswordChange);
        setNeedsRoleSelection(false);
        return { success: true, needsRoleSelection: false };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  }, []);

  const selectRole = useCallback((role: UserRole) => {
    if (!user) return;
    
    const userRoles = getUserRoles(user);
    if (!userRoles.includes(role)) {
      console.error('Selected role is not available for this user');
      return;
    }

    updateSessionActiveRole(role);
    setActiveRole(role);
    setNeedsRoleSelection(false);
  }, [user]);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setActiveRole(null);
    setRequiresPasswordChange(false);
    setNeedsRoleSelection(false);
  }, []);

  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!user || !activeRole) return false;
    
    // Use activeRole from session instead of user.rol
    if (Array.isArray(role)) {
      return role.includes(activeRole);
    }
    return activeRole === role;
  }, [user, activeRole]);

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
    activeRole,
    isLoading,
    isAuthenticated: !!user && !!activeRole && !needsRoleSelection,
    requiresPasswordChange,
    needsRoleSelection,
    login,
    selectRole,
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
