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
  rol: UserRole | UserRole[]; // Permite múltiples roles
  carrera: string;
  semestre: string; // Para estudiantes: semestre actual. Para coordinadores: NO aplica
  estado: UserStatus;
  telefono: string;
  forcePasswordChange: boolean;
  coordinadorCarrera?: string; // Para coordinadores, qué carrera coordinan (ID de carrera)
  createdAt: string;
}

// Tutoring status
export type TutoriaStatus = 'Solicitada' | 'pendiente' | 'aceptada' | 'rechazada' | 'finalizada';

// Tutoring interface
export interface Tutoria {
  id: string;
  estudianteId: string;
  docenteId: string;
  materiaId: string; // Materia solicitada
  semestreId: string; // Semestre del estudiante
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

// Semestre interface
export interface Semestre {
  id: string;
  nombre: string; // Ej: "1er Semestre", "2do Semestre", etc.
  numero: number; // 1, 2, 3, etc.
  activo: boolean;
  createdAt: string;
}

// Unidad académica
export type UnidadAcademica = 'Básica' | 'Profesional' | 'Titulación';

// Materia interface - Malla Curricular
export interface Materia {
  id: string;
  nombre: string;
  codigo: string;
  carreraId: string;
  semestreId: string; // Semestre al que pertenece la materia (puede ser numérico o "Final")
  descripcion?: string;
  creditos?: number;
  horas?: number; // Horas totales de la materia
  unidad?: UnidadAcademica; // Básica, Profesional, Titulación
  prerequisitos?: string[]; // Array de códigos de materias previas
  estado: 'pendiente' | 'aprobada' | 'rechazada'; // Para aprobación del administrador
  coordinadorId?: string; // Coordinador que la creó
  activa: boolean;
  createdAt: string;
}

// Relación Docente-Materia-Semestre
export interface DocenteMateriaSemestre {
  id: string;
  docenteId: string;
  materiaId: string;
  semestreId: string;
  carreraId: string; // Carrera del docente
  activo: boolean;
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
  tipo: 'solicitud' | 'aceptada' | 'rechazada' | 'reprogramada' | 'calificacion' | 'mensaje' | 'pdf' | 'usuarios';
  leido: boolean;
  fecha: string;
  tutoriaId?: string;
  mensajeId?: string;
  pdfId?: string;
  rolDestino?: UserRole; // Para notificaciones basadas en rol
  carreraDestino?: string; // Para notificaciones basadas en carrera
}

// PDF interface - Solo metadata, archivos no se almacenan en LocalStorage
export interface PDF {
  id: string;
  nombre: string;
  carrera: string; // ID de la carrera
  rolSubida: UserRole; // Rol del usuario que subió el PDF
  usuarioSubida: string; // ID del usuario que subió el PDF
  fecha: string;
  nombreArchivo: string; // Nombre original del archivo
  tamaño?: number; // Tamaño en bytes
  descripcion?: string; // Descripción opcional
  activo: boolean; // Para activar/desactivar PDFs sin eliminarlos
}

// Session interface
export interface Session {
  user: User;
  activeRole?: UserRole; // Rol activo cuando el usuario tiene múltiples roles
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
  materiaId: string;
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

// Excel Malla Curricular interface
export interface ExcelMallaRow {
  carrera: string;
  unidad: string;
  semestre: string;
  codigoAsignatura: string;
  nombreAsignatura: string;
  creditos: string | number;
  horas: string | number;
  prerequisitos: string;
}

// User metrics interface
export interface UserMetrics {
  total: number;
  porRol: Record<UserRole, number>;
  porCarrera: Record<string, number>;
  activos: number;
  inactivos: number;
}
