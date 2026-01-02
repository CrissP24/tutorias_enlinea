// User roles
export type UserRole = 'admin' | 'docente' | 'estudiante';

// User interface
export interface User {
  id: string;
  nombre: string;
  email: string;
  password: string; // Encrypted
  rol: UserRole;
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
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
  rol: UserRole;
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
