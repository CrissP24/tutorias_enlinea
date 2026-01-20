import CryptoJS from 'crypto-js';
import type { User, Tutoria, Session, UserRole, Notification, Periodo, Mensaje, UserStatus, Carrera, Materia, Semestre, DocenteMateriaSemestre, PDF, UserMetrics } from '@/types';

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
  SEMESTRES: 'tutorias_semestres',
  DOCENTE_MATERIA_SEMESTRE: 'tutorias_docente_materia_semestre',
  PDFS: 'tutorias_pdfs',
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
    estado: data.estado || 'Solicitada', // Estado inicial por defecto
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
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 10); // Solo últimas 10 notificaciones
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
  
  // Limpieza automática: mantener solo las últimas 100 notificaciones por usuario
  const userNotifications = notifications.filter(n => n.userId === data.userId);
  if (userNotifications.length > 100) {
    const sorted = userNotifications.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    const toKeep = sorted.slice(0, 100);
    const toRemove = sorted.slice(100);
    toRemove.forEach(n => {
      const index = notifications.findIndex(notif => notif.id === n.id);
      if (index !== -1) notifications.splice(index, 1);
    });
  }
  
  saveNotifications(notifications);
  return newNotification;
};

// Crear notificación para múltiples usuarios por rol
export const createNotificationByRole = (
  rol: UserRole,
  mensaje: string,
  tipo: Notification['tipo'],
  pdfId?: string,
  carreraDestino?: string
): Notification[] => {
  const users = getUsers().filter(user => {
    const userRoles = Array.isArray(user.rol) ? user.rol : [user.rol];
    return userRoles.includes(rol) && user.estado === 'activo';
  });

  return users.map(user => {
    return createNotification({
      userId: user.id,
      mensaje,
      tipo,
      pdfId,
      rolDestino: rol,
      carreraDestino,
    });
  });
};

// Crear notificación para usuarios de una carrera específica
export const createNotificationByCarrera = (
  carrera: string,
  mensaje: string,
  tipo: Notification['tipo'],
  pdfId?: string
): Notification[] => {
  const users = getUsers().filter(
    user => user.carrera.toLowerCase() === carrera.toLowerCase() && user.estado === 'activo'
  );

  return users.map(user => {
    return createNotification({
      userId: user.id,
      mensaje,
      tipo,
      pdfId,
      carreraDestino: carrera,
    });
  });
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

export const saveSession = (user: User, activeRole?: UserRole): void => {
  const session: Session = {
    user,
    activeRole: activeRole || (Array.isArray(user.rol) ? user.rol[0] : user.rol),
    loginAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
};

export const updateSessionUser = (user: User): void => {
  const session = getSession();
  if (session) {
    session.user = user;
    // Si el usuario tiene múltiples roles y el rol activo ya no está disponible, usar el primero
    if (Array.isArray(user.rol) && session.activeRole && !user.rol.includes(session.activeRole)) {
      session.activeRole = user.rol[0];
    }
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  }
};

export const updateSessionActiveRole = (activeRole: UserRole): void => {
  const session = getSession();
  if (session) {
    session.activeRole = activeRole;
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
        rol: ['coordinador', 'docente'], // Coordinador siempre tiene ambos roles
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

  // Initialize default semestres if none exist
  const semestres = getSemestres();
  if (semestres.length === 0) {
    const defaultSemestres: Semestre[] = [
      { id: generateId(), nombre: '1er Semestre', numero: 1, activo: true, createdAt: new Date().toISOString() },
      { id: generateId(), nombre: '2do Semestre', numero: 2, activo: true, createdAt: new Date().toISOString() },
      { id: generateId(), nombre: '3er Semestre', numero: 3, activo: true, createdAt: new Date().toISOString() },
      { id: generateId(), nombre: '4to Semestre', numero: 4, activo: true, createdAt: new Date().toISOString() },
      { id: generateId(), nombre: '5to Semestre', numero: 5, activo: true, createdAt: new Date().toISOString() },
      { id: generateId(), nombre: '6to Semestre', numero: 6, activo: true, createdAt: new Date().toISOString() },
      { id: generateId(), nombre: '7mo Semestre', numero: 7, activo: true, createdAt: new Date().toISOString() },
      { id: generateId(), nombre: '8vo Semestre', numero: 8, activo: true, createdAt: new Date().toISOString() },
      { id: generateId(), nombre: '9no Semestre', numero: 9, activo: true, createdAt: new Date().toISOString() },
      { id: generateId(), nombre: '10mo Semestre', numero: 10, activo: true, createdAt: new Date().toISOString() },
      { id: generateId(), nombre: 'Final', numero: 99, activo: true, createdAt: new Date().toISOString() },
    ];
    saveSemestres(defaultSemestres);
  } else {
    // Asegurar que el semestre "Final" existe (por si se añadió después)
    const semestreFinal = getSemestreByNombre('Final');
    if (!semestreFinal) {
      const semestresActuales = getSemestres();
      semestresActuales.push({
        id: generateId(),
        nombre: 'Final',
        numero: 99,
        activo: true,
        createdAt: new Date().toISOString(),
      });
      saveSemestres(semestresActuales);
    }
  }

  // Initialize default carreras if none exist
  const carreras = getCarreras();
  if (carreras.length === 0) {
    const defaultCarreras: Carrera[] = [
      { id: generateId(), nombre: 'Ingeniería de Software', codigo: 'IS', descripcion: 'Carrera de Ingeniería de Software', activa: true, createdAt: new Date().toISOString() },
      { id: generateId(), nombre: 'Ciencias de la Computación', codigo: 'CC', descripcion: 'Carrera de Ciencias de la Computación', activa: true, createdAt: new Date().toISOString() },
      { id: generateId(), nombre: 'Ingeniería de Sistemas', codigo: 'SIS', descripcion: 'Carrera de Ingeniería de Sistemas', activa: true, createdAt: new Date().toISOString() },
    ];
    saveCarreras(defaultCarreras);
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

export const getMateriaByCodigo = (codigo: string): Materia | undefined => {
  return getMaterias().find(m => m.codigo.toLowerCase() === codigo.toLowerCase());
};

export const getMateriasBySemestre = (semestreId: string): Materia[] => {
  return getMaterias().filter(m => m.semestreId === semestreId && m.activa && m.estado === 'aprobada');
};

// ==================== SEMESTRES ====================

export const getSemestres = (): Semestre[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SEMESTRES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveSemestres = (semestres: Semestre[]): void => {
  localStorage.setItem(STORAGE_KEYS.SEMESTRES, JSON.stringify(semestres));
};

export const getSemestreById = (id: string): Semestre | undefined => {
  return getSemestres().find(s => s.id === id);
};

export const getSemestreByNombre = (nombre: string): Semestre | undefined => {
  return getSemestres().find(s => s.nombre.toLowerCase() === nombre.toLowerCase());
};

export const createSemestre = (data: Omit<Semestre, 'id' | 'createdAt'>): Semestre | null => {
  // Check if nombre already exists
  if (getSemestreByNombre(data.nombre)) {
    return null;
  }

  const semestres = getSemestres();
  const newSemestre: Semestre = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  semestres.push(newSemestre);
  saveSemestres(semestres);
  return newSemestre;
};

export const updateSemestre = (id: string, updates: Partial<Omit<Semestre, 'id' | 'createdAt'>>): Semestre | null => {
  const semestres = getSemestres();
  const index = semestres.findIndex(s => s.id === id);
  
  if (index === -1) return null;

  // If updating nombre, check it doesn't already exist
  if (updates.nombre && updates.nombre !== semestres[index].nombre) {
    const existingSemestre = getSemestreByNombre(updates.nombre);
    if (existingSemestre) return null;
  }

  semestres[index] = { ...semestres[index], ...updates };
  saveSemestres(semestres);
  return semestres[index];
};

export const deleteSemestre = (id: string): boolean => {
  const semestres = getSemestres();
  const filteredSemestres = semestres.filter(s => s.id !== id);
  
  if (filteredSemestres.length === semestres.length) return false;
  
  saveSemestres(filteredSemestres);
  return true;
};

// ==================== DOCENTE-MATERIA-SEMESTRE ====================

export const getDocenteMateriaSemestres = (): DocenteMateriaSemestre[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DOCENTE_MATERIA_SEMESTRE);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveDocenteMateriaSemestres = (relaciones: DocenteMateriaSemestre[]): void => {
  localStorage.setItem(STORAGE_KEYS.DOCENTE_MATERIA_SEMESTRE, JSON.stringify(relaciones));
};

export const getDocenteMateriaSemestreById = (id: string): DocenteMateriaSemestre | undefined => {
  return getDocenteMateriaSemestres().find(r => r.id === id);
};

export const getDocentesByMateriaSemestre = (materiaId: string, semestreId: string, carreraId: string): User[] => {
  const relaciones = getDocenteMateriaSemestres();
  const relacionesFiltradas = relaciones.filter(
    r => r.materiaId === materiaId && 
         r.semestreId === semestreId && 
         r.carreraId === carreraId && 
         r.activo
  );
  const docenteIds = relacionesFiltradas.map(r => r.docenteId);
  return getUsers().filter(u => docenteIds.includes(u.id) && u.rol === 'docente' && u.estado === 'activo');
};

export const getMateriasByDocenteSemestre = (docenteId: string, semestreId: string): Materia[] => {
  const relaciones = getDocenteMateriaSemestres();
  const relacionesFiltradas = relaciones.filter(
    r => r.docenteId === docenteId && r.semestreId === semestreId && r.activo
  );
  const materiaIds = relacionesFiltradas.map(r => r.materiaId);
  return getMaterias().filter(m => materiaIds.includes(m.id) && m.activa && m.estado === 'aprobada');
};

export const createDocenteMateriaSemestre = (data: Omit<DocenteMateriaSemestre, 'id' | 'createdAt'>): DocenteMateriaSemestre | null => {
  // Check if relation already exists
  const relaciones = getDocenteMateriaSemestres();
  const exists = relaciones.some(
    r => r.docenteId === data.docenteId && 
         r.materiaId === data.materiaId && 
         r.semestreId === data.semestreId
  );
  
  if (exists) {
    return null;
  }

  const newRelacion: DocenteMateriaSemestre = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  relaciones.push(newRelacion);
  saveDocenteMateriaSemestres(relaciones);
  return newRelacion;
};

export const updateDocenteMateriaSemestre = (id: string, updates: Partial<Omit<DocenteMateriaSemestre, 'id' | 'createdAt'>>): DocenteMateriaSemestre | null => {
  const relaciones = getDocenteMateriaSemestres();
  const index = relaciones.findIndex(r => r.id === id);
  
  if (index === -1) return null;

  relaciones[index] = { ...relaciones[index], ...updates };
  saveDocenteMateriaSemestres(relaciones);
  return relaciones[index];
};

export const deleteDocenteMateriaSemestre = (id: string): boolean => {
  const relaciones = getDocenteMateriaSemestres();
  const filteredRelaciones = relaciones.filter(r => r.id !== id);
  
  if (filteredRelaciones.length === relaciones.length) return false;
  
  saveDocenteMateriaSemestres(filteredRelaciones);
  return true;
};

// ==================== PDFs ====================

export const getPDFs = (): PDF[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PDFS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const savePDFs = (pdfs: PDF[]): void => {
  localStorage.setItem(STORAGE_KEYS.PDFS, JSON.stringify(pdfs));
};

export const getPDFById = (id: string): PDF | undefined => {
  return getPDFs().find(pdf => pdf.id === id);
};

export const getPDFsByCarrera = (carreraId: string): PDF[] => {
  return getPDFs().filter(pdf => pdf.carrera === carreraId && pdf.activo);
};

export const getPDFsByUsuario = (usuarioId: string): PDF[] => {
  return getPDFs().filter(pdf => pdf.usuarioSubida === usuarioId);
};

export const createPDF = (data: Omit<PDF, 'id' | 'fecha' | 'activo'>): PDF => {
  const pdfs = getPDFs();
  
  const newPDF: PDF = {
    ...data,
    id: generateId(),
    fecha: new Date().toISOString(),
    activo: true,
  };

  pdfs.push(newPDF);
  savePDFs(pdfs);
  return newPDF;
};

export const updatePDF = (id: string, updates: Partial<Omit<PDF, 'id' | 'fecha'>>): PDF | null => {
  const pdfs = getPDFs();
  const index = pdfs.findIndex(pdf => pdf.id === id);
  
  if (index === -1) return null;

  pdfs[index] = { ...pdfs[index], ...updates };
  savePDFs(pdfs);
  return pdfs[index];
};

export const deletePDF = (id: string): boolean => {
  const pdfs = getPDFs();
  const filteredPDFs = pdfs.filter(pdf => pdf.id !== id);
  
  if (filteredPDFs.length === pdfs.length) return false;
  
  savePDFs(filteredPDFs);
  
  // Delete associated notifications
  const notifications = getNotifications();
  const filteredNotifications = notifications.filter(n => n.pdfId !== id);
  saveNotifications(filteredNotifications);
  
  return true;
};

// ==================== METRICS ====================

export const getUserMetrics = (): UserMetrics => {
  const users = getUsers();
  const metrics: UserMetrics = {
    total: users.length,
    porRol: {
      admin: 0,
      coordinador: 0,
      docente: 0,
      estudiante: 0,
    },
    porCarrera: {},
    activos: 0,
    inactivos: 0,
  };

  users.forEach(user => {
    // Contar por estado
    if (user.estado === 'activo') {
      metrics.activos++;
    } else {
      metrics.inactivos++;
    }

    // Contar por rol
    const roles = Array.isArray(user.rol) ? user.rol : [user.rol];
    roles.forEach(rol => {
      if (metrics.porRol[rol] !== undefined) {
        metrics.porRol[rol]++;
      }
    });

    // Contar por carrera
    const carrera = user.carrera || 'Sin carrera';
    metrics.porCarrera[carrera] = (metrics.porCarrera[carrera] || 0) + 1;
  });

  return metrics;
};
