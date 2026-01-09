// User roles
export type UserRole = 'admin' | 'coordinador' | 'docente' | 'estudiante';

// User status
export type UserStatus = 'activo' | 'inactivo';

// User interface - Updated with new fields
export interface User {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  password: string; // Encrypted
  rol: UserRole;
  carrera: string;
  semestre: string;
  estado: UserStatus;
  telefono: string;
  forcePasswordChange: boolean;
  coordinadorCarrera?: string; // Para coordinadores, qué carrera coordinan
  carreraTutoria?: string; // Para docentes, carrera asignada para tutorías (pueden estar en varias pero una para tutorías)
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

// Period interface
export interface Periodo {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  anio: number;
  createdAt: string;
}

// Carrera interface
export interface Carrera {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  activa: boolean;
  createdAt: string;
}

// Materia interface
export interface Materia {
  id: string;
  nombre: string;
  codigo: string;
  carreraId: string;
  descripcion?: string;
  creditos?: number;
  estado: 'pendiente' | 'aprobada' | 'rechazada'; // Para aprobación del administrador
  coordinadorId?: string; // Coordinador que la creó
  activa: boolean;
  createdAt: string;
}

// Message interface - para chat entre docente y estudiante
export interface Mensaje {
  id: string;
  tutoriaId: string;
  remitente: string; // userId
  contenido: string;
  leido: boolean;
  fecha: string;
}

// Notification interface
export interface Notification {
  id: string;
  userId: string;
  mensaje: string;
  tipo: 'solicitud' | 'aceptada' | 'rechazada' | 'reprogramada' | 'calificacion' | 'mensaje';
  leido: boolean;
  fecha: string;
  tutoriaId?: string;
  mensajeId?: string;
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
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  confirmPassword: string;
  rol: UserRole;
  carrera: string;
  semestre: string;
  telefono: string;
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
  nombres: string;
  apellidos: string;
  email: string;
  carrera: string;
  semestre: string;
  telefono: string;
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
