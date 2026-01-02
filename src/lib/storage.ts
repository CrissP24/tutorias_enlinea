import CryptoJS from 'crypto-js';
import type { User, Tutoria, Session, UserRole, Notification, UserStatus } from '@/types';

// Storage keys
const STORAGE_KEYS = {
  USERS: 'tutorias_users',
  TUTORIAS: 'tutorias_data',
  SESSION: 'tutorias_session',
  NOTIFICATIONS: 'tutorias_notifications',
} as const;

// Secret key for encryption (in production, this should be more secure)
const SECRET_KEY = 'tutorias-academicas-2024-key';

// ==================== ENCRYPTION ====================

export const encryptPassword = (password: string): string => {
  return CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
};

export const verifyPassword = (password: string, encryptedPassword: string): boolean => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return password === decrypted;
  } catch {
    return false;
  }
};

// ==================== USERS ====================

export const getUsers = (): User[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveUsers = (users: User[]): void => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getUserById = (id: string): User | undefined => {
  return getUsers().find(user => user.id === id);
};

export const getUserByEmail = (email: string): User | undefined => {
  return getUsers().find(user => user.email.toLowerCase() === email.toLowerCase());
};

export const getUserByCedula = (cedula: string): User | undefined => {
  return getUsers().find(user => user.cedula === cedula);
};

export const getUsersByRole = (role: UserRole): User[] => {
  return getUsers().filter(user => user.rol === role && user.estado === 'activo');
};

export const getUsersByCarrera = (carrera: string): User[] => {
  return getUsers().filter(user => user.carrera.toLowerCase() === carrera.toLowerCase());
};

export const getUsersByNivel = (nivel: string): User[] => {
  return getUsers().filter(user => user.nivel === nivel);
};

export const createUser = (userData: Omit<User, 'id' | 'createdAt'>): User | null => {
  // Check if email already exists
  if (getUserByEmail(userData.email)) {
    return null;
  }

  // Check if cedula already exists
  if (getUserByCedula(userData.cedula)) {
    return null;
  }

  const users = getUsers();
  const newUser: User = {
    ...userData,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
};

export const updateUser = (id: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'cedula'>>): User | null => {
  const users = getUsers();
  const index = users.findIndex(user => user.id === id);
  
  if (index === -1) return null;

  // If updating email, check it doesn't already exist
  if (updates.email && updates.email !== users[index].email) {
    const existingUser = getUserByEmail(updates.email);
    if (existingUser) return null;
  }

  users[index] = { ...users[index], ...updates };
  saveUsers(users);
  return users[index];
};

export const deleteUser = (id: string): boolean => {
  const users = getUsers();
  const filteredUsers = users.filter(user => user.id !== id);
  
  if (filteredUsers.length === users.length) return false;
  
  saveUsers(filteredUsers);
  
  // Also delete associated tutorias
  const tutorias = getTutorias();
  const filteredTutorias = tutorias.filter(
    t => t.estudianteId !== id && t.docenteId !== id
  );
  saveTutorias(filteredTutorias);

  // Delete associated notifications
  const notifications = getNotifications();
  const filteredNotifications = notifications.filter(n => n.userId !== id);
  saveNotifications(filteredNotifications);
  
  return true;
};

// ==================== TUTORIAS ====================

export const getTutorias = (): Tutoria[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TUTORIAS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveTutorias = (tutorias: Tutoria[]): void => {
  localStorage.setItem(STORAGE_KEYS.TUTORIAS, JSON.stringify(tutorias));
};

export const getTutoriaById = (id: string): Tutoria | undefined => {
  return getTutorias().find(tutoria => tutoria.id === id);
};

export const getTutoriasByEstudiante = (estudianteId: string): Tutoria[] => {
  return getTutorias().filter(t => t.estudianteId === estudianteId);
};

export const getTutoriasByDocente = (docenteId: string): Tutoria[] => {
  return getTutorias().filter(t => t.docenteId === docenteId);
};

export const createTutoria = (data: Omit<Tutoria, 'id' | 'createdAt' | 'updatedAt'>): Tutoria => {
  const tutorias = getTutorias();
  const now = new Date().toISOString();
  
  const newTutoria: Tutoria = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };

  tutorias.push(newTutoria);
  saveTutorias(tutorias);
  return newTutoria;
};

export const updateTutoria = (id: string, updates: Partial<Omit<Tutoria, 'id' | 'createdAt'>>): Tutoria | null => {
  const tutorias = getTutorias();
  const index = tutorias.findIndex(t => t.id === id);
  
  if (index === -1) return null;

  tutorias[index] = { 
    ...tutorias[index], 
    ...updates, 
    updatedAt: new Date().toISOString() 
  };
  saveTutorias(tutorias);
  return tutorias[index];
};

export const deleteTutoria = (id: string): boolean => {
  const tutorias = getTutorias();
  const filteredTutorias = tutorias.filter(t => t.id !== id);
  
  if (filteredTutorias.length === tutorias.length) return false;
  
  saveTutorias(filteredTutorias);
  return true;
};

// ==================== NOTIFICATIONS ====================

export const getNotifications = (): Notification[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveNotifications = (notifications: Notification[]): void => {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
};

export const getNotificationsByUser = (userId: string): Notification[] => {
  return getNotifications()
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
};

export const getUnreadNotificationsCount = (userId: string): number => {
  return getNotifications().filter(n => n.userId === userId && !n.leido).length;
};

export const createNotification = (data: Omit<Notification, 'id' | 'fecha' | 'leido'>): Notification => {
  const notifications = getNotifications();
  
  const newNotification: Notification = {
    ...data,
    id: generateId(),
    leido: false,
    fecha: new Date().toISOString(),
  };

  notifications.push(newNotification);
  saveNotifications(notifications);
  return newNotification;
};

export const markNotificationAsRead = (id: string): void => {
  const notifications = getNotifications();
  const index = notifications.findIndex(n => n.id === id);
  
  if (index !== -1) {
    notifications[index].leido = true;
    saveNotifications(notifications);
  }
};

export const markAllNotificationsAsRead = (userId: string): void => {
  const notifications = getNotifications();
  notifications.forEach(n => {
    if (n.userId === userId) {
      n.leido = true;
    }
  });
  saveNotifications(notifications);
};

// ==================== SESSION ====================

export const getSession = (): Session | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const saveSession = (user: User): void => {
  const session: Session = {
    user,
    loginAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
};

export const updateSessionUser = (user: User): void => {
  const session = getSession();
  if (session) {
    session.user = user;
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  }
};

export const clearSession = (): void => {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
};

// ==================== UTILITIES ====================

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Initialize with default admin user if no users exist
export const initializeStorage = (): void => {
  const users = getUsers();
  
  if (users.length === 0) {
    const adminPassword = encryptPassword('admin123');
    const defaultUsers: User[] = [
      {
        id: generateId(),
        cedula: '0000000001',
        nombre: 'Administrador',
        email: 'admin@tutorias.com',
        password: adminPassword,
        rol: 'admin',
        carrera: 'Sistemas',
        nivel: 'N/A',
        estado: 'activo',
        forcePasswordChange: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        cedula: '1234567890',
        nombre: 'Dr. Carlos Rodríguez',
        email: 'carlos.docente@tutorias.com',
        password: encryptPassword('docente123'),
        rol: 'docente',
        carrera: 'Ingeniería de Software',
        nivel: 'N/A',
        estado: 'activo',
        forcePasswordChange: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        cedula: '0987654321',
        nombre: 'Dra. María López',
        email: 'maria.docente@tutorias.com',
        password: encryptPassword('docente123'),
        rol: 'docente',
        carrera: 'Ciencias de la Computación',
        nivel: 'N/A',
        estado: 'activo',
        forcePasswordChange: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        cedula: '1122334455',
        nombre: 'Juan Pérez',
        email: 'juan.estudiante@tutorias.com',
        password: encryptPassword('estudiante123'),
        rol: 'estudiante',
        carrera: 'Ingeniería de Software',
        nivel: '5to Semestre',
        estado: 'activo',
        forcePasswordChange: false,
        createdAt: new Date().toISOString(),
      },
    ];
    saveUsers(defaultUsers);
  }
};

// XSS Prevention - sanitize inputs
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate cedula format (numeric, 10 digits)
export const isValidCedula = (cedula: string): boolean => {
  const cedulaRegex = /^\d{10}$/;
  return cedulaRegex.test(cedula);
};

// Validate password strength (min 8 characters)
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};
