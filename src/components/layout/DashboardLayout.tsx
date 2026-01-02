import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/notifications/NotificationBell';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Star, 
  FileText,
  LogOut,
  Menu,
  X,
  Home,
  User,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const getNavItems = (): NavItem[] => {
    if (!user) return [];

    const baseItems: NavItem[] = [
      { label: 'Dashboard', path: `/${user.rol}`, icon: <LayoutDashboard className="h-5 w-5" /> },
      { label: 'Calendario', path: '/calendario', icon: <CalendarDays className="h-5 w-5" /> },
      { label: 'Mi Perfil', path: '/perfil', icon: <User className="h-5 w-5" /> },
    ];

    switch (user.rol) {
      case 'admin':
        return [
          { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: 'Usuarios', path: '/admin/usuarios', icon: <Users className="h-5 w-5" /> },
          { label: 'Tutorías', path: '/admin/tutorias', icon: <BookOpen className="h-5 w-5" /> },
          { label: 'Calendario', path: '/calendario', icon: <CalendarDays className="h-5 w-5" /> },
          { label: 'Reportes', path: '/admin/reportes', icon: <FileText className="h-5 w-5" /> },
          { label: 'Mi Perfil', path: '/perfil', icon: <User className="h-5 w-5" /> },
        ];
      case 'docente':
        return [
          { label: 'Dashboard', path: '/docente', icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: 'Solicitudes', path: '/docente/solicitudes', icon: <BookOpen className="h-5 w-5" /> },
          { label: 'Historial', path: '/docente/historial', icon: <FileText className="h-5 w-5" /> },
          { label: 'Calendario', path: '/calendario', icon: <CalendarDays className="h-5 w-5" /> },
          { label: 'Calificaciones', path: '/docente/calificaciones', icon: <Star className="h-5 w-5" /> },
          { label: 'Mi Perfil', path: '/perfil', icon: <User className="h-5 w-5" /> },
        ];
      case 'estudiante':
        return [
          { label: 'Dashboard', path: '/estudiante', icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: 'Solicitar Tutoría', path: '/estudiante/solicitar', icon: <BookOpen className="h-5 w-5" /> },
          { label: 'Mis Tutorías', path: '/estudiante/historial', icon: <FileText className="h-5 w-5" /> },
          { label: 'Calendario', path: '/calendario', icon: <CalendarDays className="h-5 w-5" /> },
          { label: 'Mi Perfil', path: '/perfil', icon: <User className="h-5 w-5" /> },
        ];
      default:
        return baseItems;
    }
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleName = () => {
    switch (user?.rol) {
      case 'admin': return 'Administrador';
      case 'docente': return 'Docente';
      case 'estudiante': return 'Estudiante';
      default: return '';
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        "flex flex-col gradient-hero",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-sidebar-foreground">Tutorías</span>
            <span className="text-xs text-sidebar-foreground/60">Académicas</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="ml-auto lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                location.pathname === item.path
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              {user?.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.nombre}</p>
              <p className="text-xs text-sidebar-foreground/60">{getRoleName()}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-5 w-5" />Cerrar Sesión
          </Button>
        </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-md">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-foreground hover:text-primary">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">
              {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h1>
          </div>
          <NotificationBell />
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Home className="h-5 w-5" />
            <span className="hidden sm:inline text-sm">Inicio</span>
          </Link>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
