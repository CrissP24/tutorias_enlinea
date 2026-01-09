import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import CalendarPage from "./pages/CalendarPage";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminTutorias from "./pages/admin/AdminTutorias";
import AdminReportes from "./pages/admin/AdminReportes";
import AdminPeriodos from "./pages/admin/AdminPeriodos";
import AdminCarreras from "./pages/admin/AdminCarreras";
import AdminMaterias from "./pages/admin/AdminMaterias";

// Coordinador
import CoordinadorDashboard from "./pages/coordinador/CoordinadorDashboard";
import CoordinadorTutorias from "./pages/coordinador/CoordinadorTutorias";
import CoordinadorReportes from "./pages/coordinador/CoordinadorReportes";
import CoordinadorMaterias from "./pages/coordinador/CoordinadorMaterias";
import CoordinadorCargaMasiva from "./pages/coordinador/CoordinadorCargaMasiva";

// Docente
import DocenteDashboard from "./pages/docente/DocenteDashboard";
import DocenteSolicitudes from "./pages/docente/DocenteSolicitudes";
import DocenteHistorial from "./pages/docente/DocenteHistorial";
import DocenteCalificaciones from "./pages/docente/DocenteCalificaciones";

// Estudiante
import EstudianteDashboard from "./pages/estudiante/EstudianteDashboard";
import EstudianteSolicitar from "./pages/estudiante/EstudianteSolicitar";
import EstudianteHistorial from "./pages/estudiante/EstudianteHistorial";
import EstudianteReportes from "./pages/estudiante/EstudianteReportes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Profile - All authenticated users */}
            <Route path="/perfil" element={<ProtectedRoute allowedRoles={['admin', 'coordinador', 'docente', 'estudiante']}><ProfilePage /></ProtectedRoute>} />
            <Route path="/calendario" element={<ProtectedRoute allowedRoles={['admin', 'coordinador', 'docente', 'estudiante']}><CalendarPage /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/usuarios" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsuarios /></ProtectedRoute>} />
            <Route path="/admin/carreras" element={<ProtectedRoute allowedRoles={['admin']}><AdminCarreras /></ProtectedRoute>} />
            <Route path="/admin/materias" element={<ProtectedRoute allowedRoles={['admin']}><AdminMaterias /></ProtectedRoute>} />
            <Route path="/admin/tutorias" element={<ProtectedRoute allowedRoles={['admin']}><AdminTutorias /></ProtectedRoute>} />
            <Route path="/admin/periodos" element={<ProtectedRoute allowedRoles={['admin']}><AdminPeriodos /></ProtectedRoute>} />
            <Route path="/admin/reportes" element={<ProtectedRoute allowedRoles={['admin']}><AdminReportes /></ProtectedRoute>} />

            {/* Coordinador */}
            <Route path="/coordinador" element={<ProtectedRoute allowedRoles={['coordinador']}><CoordinadorDashboard /></ProtectedRoute>} />
            <Route path="/coordinador/materias" element={<ProtectedRoute allowedRoles={['coordinador']}><CoordinadorMaterias /></ProtectedRoute>} />
            <Route path="/coordinador/carga-masiva" element={<ProtectedRoute allowedRoles={['coordinador']}><CoordinadorCargaMasiva /></ProtectedRoute>} />
            <Route path="/coordinador/tutorias" element={<ProtectedRoute allowedRoles={['coordinador']}><CoordinadorTutorias /></ProtectedRoute>} />
            <Route path="/coordinador/reportes" element={<ProtectedRoute allowedRoles={['coordinador']}><CoordinadorReportes /></ProtectedRoute>} />

            {/* Docente */}
            <Route path="/docente" element={<ProtectedRoute allowedRoles={['docente']}><DocenteDashboard /></ProtectedRoute>} />
            <Route path="/docente/solicitudes" element={<ProtectedRoute allowedRoles={['docente']}><DocenteSolicitudes /></ProtectedRoute>} />
            <Route path="/docente/historial" element={<ProtectedRoute allowedRoles={['docente']}><DocenteHistorial /></ProtectedRoute>} />
            <Route path="/docente/calificaciones" element={<ProtectedRoute allowedRoles={['docente']}><DocenteCalificaciones /></ProtectedRoute>} />

            {/* Estudiante */}
            <Route path="/estudiante" element={<ProtectedRoute allowedRoles={['estudiante']}><EstudianteDashboard /></ProtectedRoute>} />
            <Route path="/estudiante/solicitar" element={<ProtectedRoute allowedRoles={['estudiante']}><EstudianteSolicitar /></ProtectedRoute>} />
            <Route path="/estudiante/historial" element={<ProtectedRoute allowedRoles={['estudiante']}><EstudianteHistorial /></ProtectedRoute>} />
            <Route path="/estudiante/reportes" element={<ProtectedRoute allowedRoles={['estudiante']}><EstudianteReportes /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
