// User roles
export type UserRole = 'admin' | 'docente' | 'estudiante';

// User status
export type UserStatus = 'activo' | 'inactivo';

// User interface - Updated with new fields
export interface User {
  id: string;
  cedula: string;
  nombre: string;
  email: string;
  password: string; // Encrypted
  rol: UserRole;
  carrera: string;
  nivel: string;
  estado: UserStatus;
  forcePasswordChange: boolean;
  createdAt: string;
}

// Tutoring status
export type TutoriaStatus = 'pendiente' | 'aceptada' | 'rechazada' | 'finalizada';

// Tutoring interface
export interface Tutoria {
  id: string;
  estudianteId: string;
  docenteId: string;
  tema: string;
  descripcion: string;
  fecha: string;
  hora: string;
  estado: TutoriaStatus;
  calificacion?: number;
  comentario?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification interface
export interface Notification {
  id: string;
  userId: string;
  mensaje: string;
  tipo: 'solicitud' | 'aceptada' | 'rechazada' | 'reprogramada' | 'calificacion';
  leido: boolean;
  fecha: string;
  tutoriaId?: string;
}

// Session interface
export interface Session {
  user: User;
  loginAt: string;
}

// Form data interfaces
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  cedula: string;
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
  rol: UserRole;
  carrera: string;
  nivel: string;
}

export interface TutoriaFormData {
  docenteId: string;
  tema: string;
  descripcion: string;
  fecha: string;
  hora: string;
}

export interface RatingFormData {
  calificacion: number;
  comentario: string;
}

export interface ProfileFormData {
  nombre: string;
  email: string;
  carrera: string;
  nivel: string;
}

export interface PasswordChangeFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Stats for reports
export interface TutoriaStats {
  total: number;
  pendientes: number;
  aceptadas: number;
  finalizadas: number;
  rechazadas: number;
}

export interface DocenteStats {
  docenteId: string;
  docenteNombre: string;
  totalTutorias: number;
  tutoriasFinalizadas: number;
  promedioCalificacion: number;
  totalCalificaciones: number;
}

// Excel import interface
export interface ExcelUserRow {
  cedula: string;
  nombres: string;
  correo: string;
  rol: string;
  carrera: string;
  nivel: string;
  estado: string;
}
