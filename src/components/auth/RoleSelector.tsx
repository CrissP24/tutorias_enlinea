import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, GraduationCap, Users2, Shield } from 'lucide-react';
import type { UserRole } from '@/types';

const RoleSelector: React.FC = () => {
  const { user, selectRole, needsRoleSelection, activeRole, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if user doesn't need role selection
  useEffect(() => {
    if (!needsRoleSelection && activeRole && isAuthenticated) {
      navigate(`/${activeRole}`, { replace: true });
    } else if (!user) {
      navigate('/login', { replace: true });
    }
  }, [needsRoleSelection, activeRole, isAuthenticated, user, navigate]);

  if (!user || !needsRoleSelection) return null;

  // Get user roles as array
  const userRoles: UserRole[] = Array.isArray(user.rol) ? user.rol : [user.rol];

  const getRoleInfo = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          icon: <Shield className="h-8 w-8" />,
          title: 'Administrador',
          description: 'Gestiona usuarios, carreras, materias y reportes del sistema',
          color: 'bg-destructive/10 text-destructive border-destructive/20',
        };
      case 'coordinador':
        return {
          icon: <Users2 className="h-8 w-8" />,
          title: 'Coordinador',
          description: 'Gestiona materias y estudiantes de tu carrera',
          color: 'bg-purple-100 text-purple-700 border-purple-200',
        };
      case 'docente':
        return {
          icon: <UserCheck className="h-8 w-8" />,
          title: 'Docente',
          description: 'Gestiona solicitudes de tutorías y calificaciones',
          color: 'bg-success/10 text-success border-success/20',
        };
      case 'estudiante':
        return {
          icon: <GraduationCap className="h-8 w-8" />,
          title: 'Estudiante',
          description: 'Solicita tutorías y gestiona tu historial académico',
          color: 'bg-primary/10 text-primary border-primary/20',
        };
      default:
        return {
          icon: <Users className="h-8 w-8" />,
          title: role,
          description: '',
          color: 'bg-muted text-muted-foreground border-border',
        };
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    selectRole(role);
    // Redirect to the selected role's dashboard
    navigate(`/${role}`, { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl animate-scale-in">
        <Card className="border-border/50 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Selecciona tu Rol</CardTitle>
            <CardDescription className="text-base">
              Tienes acceso a múltiples roles. Selecciona con cuál deseas trabajar en esta sesión.
            </CardDescription>
            <p className="text-sm text-muted-foreground mt-2">
              Usuario: <span className="font-medium">{user.nombres} {user.apellidos}</span>
            </p>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userRoles.map((role) => {
                const roleInfo = getRoleInfo(role);
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className={`group relative overflow-hidden rounded-lg border-2 p-6 text-left transition-all hover:scale-105 hover:shadow-lg ${roleInfo.color}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {roleInfo.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{roleInfo.title}</h3>
                        <p className="text-sm opacity-80">{roleInfo.description}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Seleccionar
                      </Button>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoleSelector;

