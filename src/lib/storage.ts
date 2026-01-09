import CryptoJS from 'crypto-js';
import type { User, Tutoria, Session, UserRole, Notification, Periodo, Mensaje, UserStatus, Carrera, Materia } from '@/types';

// Storage keys
const STORAGE_KEYS = {
  USERS: 'tutorias_users',
  TUTORIAS: 'tutorias_data',
  SESSION: 'tutorias_session',
  NOTIFICATIONS: 'tutorias_notifications',
  PERIODOS: 'tutorias_periodos',
  MENSAJES: 'tutorias_mensajes',
  CARRERAS: 'tutorias_carreras',
  MATERIAS: 'tutorias_materias',
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
  return getUsers().filter(user => user.semestre === nivel);
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
        cedula: '1716043927',
        nombres: 'Administrador',
        apellidos: 'Sistema',
        email: 'admin@tutorias.com',
        password: adminPassword,
        rol: 'admin',
        carrera: 'Sistemas',
        semestre: 'N/A',
        estado: 'activo',
        telefono: '+593912345678',
        forcePasswordChange: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        cedula: '1720456789',
        nombres: 'Carlos',
        apellidos: 'Rodríguez',
        email: 'carlos.docente@tutorias.com',
        password: encryptPassword('docente123'),
        rol: 'docente',
        carrera: 'Ingeniería de Software',
        semestre: 'N/A',
        estado: 'activo',
        telefono: '+593987654321',
        forcePasswordChange: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        cedula: '1710234567',
        nombres: 'María',
        apellidos: 'López',
        email: 'maria.docente@tutorias.com',
        password: encryptPassword('docente123'),
        rol: 'docente',
        carrera: 'Ciencias de la Computación',
        semestre: 'N/A',
        estado: 'activo',
        telefono: '+593988765432',
        forcePasswordChange: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        cedula: '1725678901',
        nombres: 'Pedro',
        apellidos: 'García',
        email: 'pedro.coordinador@tutorias.com',
        password: encryptPassword('coordinador123'),
        rol: 'coordinador',
        carrera: 'Ingeniería de Software',
        semestre: 'N/A',
        estado: 'activo',
        telefono: '+593999876543',
        forcePasswordChange: false,
        coordinadorCarrera: 'Ingeniería de Software',
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        cedula: '1718901234',
        nombres: 'Juan',
        apellidos: 'Pérez',
        email: 'juan.estudiante@tutorias.com',
        password: encryptPassword('estudiante123'),
        rol: 'estudiante',
        carrera: 'Ingeniería de Software',
        semestre: '5to Semestre',
        estado: 'activo',
        telefono: '+593910111213',
        forcePasswordChange: false,
        createdAt: new Date().toISOString(),
      },
    ];
    saveUsers(defaultUsers);
  }

  // Initialize default periods if none exist
  const periodos = getPeriodos();
  if (periodos.length === 0) {
    const anioActual = new Date().getFullYear();
    const defaultPeriodos: Periodo[] = [
      {
        id: generateId(),
        nombre: `Primer Período ${anioActual}`,
        fechaInicio: `${anioActual}-01-15`,
        fechaFin: `${anioActual}-06-30`,
        activo: true,
        anio: anioActual,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        nombre: `Segundo Período ${anioActual}`,
        fechaInicio: `${anioActual}-07-01`,
        fechaFin: `${anioActual}-12-15`,
        activo: false,
        anio: anioActual,
        createdAt: new Date().toISOString(),
      },
    ];
    savePeriodos(defaultPeriodos);
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

// Validate cedula format - Ecuador (10 dígitos)
export const isValidCedulaEcuador = (cedula: string): boolean => {
  // Debe ser 10 dígitos
  if (!cedula || cedula.length !== 10 || !/^\d{10}$/.test(cedula)) {
    return false;
  }

  // Algoritmo de validación de cédula ecuatoriana
  const digitos = cedula.split('').map(Number);
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let digito = digitos[i] * coeficientes[i];
    if (digito > 9) {
      digito -= 9;
    }
    suma += digito;
  }

  const digitoVerificador = (10 - (suma % 10)) % 10;
  return digitoVerificador === digitos[9];
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

// ==================== PERIODOS ====================

export const getPeriodos = (): Periodo[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PERIODOS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const savePeriodos = (periodos: Periodo[]): void => {
  localStorage.setItem(STORAGE_KEYS.PERIODOS, JSON.stringify(periodos));
};

export const getPeriodoById = (id: string): Periodo | undefined => {
  return getPeriodos().find(p => p.id === id);
};

export const getPeriodoActivo = (): Periodo | undefined => {
  return getPeriodos().find(p => p.activo);
};

export const getPeriodosByAnio = (anio: number): Periodo[] => {
  return getPeriodos().filter(p => p.anio === anio);
};

export const createPeriodo = (data: Omit<Periodo, 'id' | 'createdAt'>): Periodo => {
  const periodos = getPeriodos();
  
  // Deactivate other periods for the same year if this is being set as active
  if (data.activo) {
    const periodosActualizados = periodos.map(p => 
      p.anio === data.anio ? { ...p, activo: false } : p
    );
    savePeriodos(periodosActualizados);
  }

  const newPeriodo: Periodo = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  periodos.push(newPeriodo);
  savePeriodos(periodos);
  return newPeriodo;
};

export const updatePeriodo = (id: string, updates: Partial<Omit<Periodo, 'id' | 'createdAt'>>): Periodo | null => {
  const periodos = getPeriodos();
  const index = periodos.findIndex(p => p.id === id);
  
  if (index === -1) return null;

  // If activating, deactivate others for the same year
  if (updates.activo) {
    periodos.forEach(p => {
      if (p.anio === periodos[index].anio && p.id !== id) {
        p.activo = false;
      }
    });
  }

  periodos[index] = { ...periodos[index], ...updates };
  savePeriodos(periodos);
  return periodos[index];
};

export const deletePeriodo = (id: string): boolean => {
  const periodos = getPeriodos();
  const filteredPeriodos = periodos.filter(p => p.id !== id);
  
  if (filteredPeriodos.length === periodos.length) return false;
  
  savePeriodos(filteredPeriodos);
  return true;
};

// ==================== MENSAJES ====================

export const getMensajes = (): Mensaje[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MENSAJES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveMensajes = (mensajes: Mensaje[]): void => {
  localStorage.setItem(STORAGE_KEYS.MENSAJES, JSON.stringify(mensajes));
};

export const getMensajesByTutoria = (tutoriaId: string): Mensaje[] => {
  return getMensajes()
    .filter(m => m.tutoriaId === tutoriaId)
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
};

export const getMensajesSinLeerByTutoria = (tutoriaId: string, userId: string): Mensaje[] => {
  return getMensajes().filter(
    m => m.tutoriaId === tutoriaId && !m.leido && m.remitente !== userId
  );
};

export const createMensaje = (data: Omit<Mensaje, 'id' | 'fecha' | 'leido'>): Mensaje => {
  const mensajes = getMensajes();
  
  const newMensaje: Mensaje = {
    ...data,
    id: generateId(),
    leido: false,
    fecha: new Date().toISOString(),
  };

  mensajes.push(newMensaje);
  saveMensajes(mensajes);
  return newMensaje;
};

export const markMensajeAsRead = (id: string): void => {
  const mensajes = getMensajes();
  const index = mensajes.findIndex(m => m.id === id);
  
  if (index !== -1) {
    mensajes[index].leido = true;
    saveMensajes(mensajes);
  }
};

export const markAllMensajesAsRead = (tutoriaId: string, userId: string): void => {
  const mensajes = getMensajes();
  mensajes.forEach(m => {
    if (m.tutoriaId === tutoriaId && m.remitente !== userId) {
      m.leido = true;
    }
  });
  saveMensajes(mensajes);
};

// ==================== CARRERAS ====================

export const getCarreras = (): Carrera[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CARRERAS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveCarreras = (carreras: Carrera[]): void => {
  localStorage.setItem(STORAGE_KEYS.CARRERAS, JSON.stringify(carreras));
};

export const getCarreraById = (id: string): Carrera | undefined => {
  return getCarreras().find(c => c.id === id);
};

export const getCarreraByCodigo = (codigo: string): Carrera | undefined => {
  return getCarreras().find(c => c.codigo.toLowerCase() === codigo.toLowerCase());
};

export const createCarrera = (data: Omit<Carrera, 'id' | 'createdAt'>): Carrera | null => {
  // Check if codigo already exists
  if (getCarreraByCodigo(data.codigo)) {
    return null;
  }

  const carreras = getCarreras();
  const newCarrera: Carrera = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  carreras.push(newCarrera);
  saveCarreras(carreras);
  return newCarrera;
};

export const updateCarrera = (id: string, updates: Partial<Omit<Carrera, 'id' | 'createdAt'>>): Carrera | null => {
  const carreras = getCarreras();
  const index = carreras.findIndex(c => c.id === id);
  
  if (index === -1) return null;

  // If updating codigo, check it doesn't already exist
  if (updates.codigo && updates.codigo !== carreras[index].codigo) {
    const existingCarrera = getCarreraByCodigo(updates.codigo);
    if (existingCarrera) return null;
  }

  carreras[index] = { ...carreras[index], ...updates };
  saveCarreras(carreras);
  return carreras[index];
};

export const deleteCarrera = (id: string): boolean => {
  const carreras = getCarreras();
  const filteredCarreras = carreras.filter(c => c.id !== id);
  
  if (filteredCarreras.length === carreras.length) return false;
  
  saveCarreras(filteredCarreras);
  return true;
};

// ==================== MATERIAS ====================

export const getMaterias = (): Materia[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MATERIAS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveMaterias = (materias: Materia[]): void => {
  localStorage.setItem(STORAGE_KEYS.MATERIAS, JSON.stringify(materias));
};

export const getMateriaById = (id: string): Materia | undefined => {
  return getMaterias().find(m => m.id === id);
};

export const getMateriasByCarrera = (carreraId: string): Materia[] => {
  return getMaterias().filter(m => m.carreraId === carreraId);
};

export const getMateriasPendientes = (): Materia[] => {
  return getMaterias().filter(m => m.estado === 'pendiente');
};

export const getMateriasAprobadas = (): Materia[] => {
  return getMaterias().filter(m => m.estado === 'aprobada' && m.activa);
};

export const createMateria = (data: Omit<Materia, 'id' | 'createdAt'>): Materia => {
  const materias = getMaterias();
  const newMateria: Materia = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  materias.push(newMateria);
  saveMaterias(materias);
  return newMateria;
};

export const updateMateria = (id: string, updates: Partial<Omit<Materia, 'id' | 'createdAt'>>): Materia | null => {
  const materias = getMaterias();
  const index = materias.findIndex(m => m.id === id);
  
  if (index === -1) return null;

  materias[index] = { ...materias[index], ...updates };
  saveMaterias(materias);
  return materias[index];
};

export const deleteMateria = (id: string): boolean => {
  const materias = getMaterias();
  const filteredMaterias = materias.filter(m => m.id !== id);
  
  if (filteredMaterias.length === materias.length) return false;
  
  saveMaterias(filteredMaterias);
  return true;
};
