import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUsers, getTutorias, getPeriodos } from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  BookOpen, 
  Star, 
  TrendingUp,
  ArrowRight,
  UserCheck,
  GraduationCap,
  Calendar
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const stats = useMemo(() => {
    const users = getUsers();
    const tutorias = getTutorias();

    const estudiantes = users.filter(u => u.rol === 'estudiante').length;
    const docentes = users.filter(u => u.rol === 'docente').length;
    const coordinadores = users.filter(u => u.rol === 'coordinador').length;
    const totalTutorias = tutorias.length;
    const finalizadas = tutorias.filter(t => t.estado === 'finalizada').length;
    
    const calificaciones = tutorias
      .filter(t => t.calificacion !== undefined)
      .map(t => t.calificacion!);
    const promedioCalificacion = calificaciones.length > 0
      ? (calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length).toFixed(1)
      : '0.0';

    return {
      estudiantes,
      docentes,
      coordinadores,
      totalTutorias,
      finalizadas,
      promedioCalificacion,
    };
  }, []);

  const recentTutorias = useMemo(() => {
    const tutorias = getTutorias();
    const users = getUsers();
    
    return tutorias
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(t => ({
        ...t,
        estudiante: users.find(u => u.id === t.estudianteId)?.nombres || 'Desconocido',
        docente: users.find(u => u.id === t.docenteId)?.nombres || 'Desconocido',
      }));
  }, []);

  const statCards = [
    {
      title: 'Estudiantes',
      value: stats.estudiantes,
      icon: <GraduationCap className="h-5 w-5" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Docentes',
      value: stats.docentes,
      icon: <UserCheck className="h-5 w-5" />,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Coordinadores',
      value: stats.coordinadores,
      icon: <Users className="h-5 w-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total Tutorías',
      value: stats.totalTutorias,
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Finalizadas',
      value: stats.finalizadas,
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Calificación Promedio',
      value: stats.promedioCalificacion,
      icon: <Star className="h-5 w-5" />,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="rounded-2xl gradient-hero p-6 text-primary-foreground">
          <h1 className="text-2xl font-bold">¡Bienvenido, {user?.nombres}!</h1>
          <p className="mt-1 text-primary-foreground/80">
            Gestiona toda la plataforma académica desde aquí.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor} ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="transition-all hover:shadow-md hover:border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Gestionar Usuarios
              </CardTitle>
              <CardDescription>
                Crear, editar o eliminar usuarios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/admin/usuarios">
                  Ver usuarios
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md hover:border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-accent" />
                Tutorías
              </CardTitle>
              <CardDescription>
                Visualiza todas las tutorías.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/admin/tutorias">
                  Ver tutorías
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md hover:border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-success" />
                Períodos
              </CardTitle>
              <CardDescription>
                Gestiona períodos académicos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/admin/periodos">
                  Gestionar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md hover:border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-success" />
                Reportes
              </CardTitle>
              <CardDescription>
                Estadísticas del sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/admin/reportes">
                  Ver reportes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas tutorías registradas</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTutorias.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay tutorías registradas aún.
              </p>
            ) : (
              <div className="space-y-4">
                {recentTutorias.map((tutoria) => (
                  <div
                    key={tutoria.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div>
                      <p className="font-medium text-foreground">{tutoria.tema}</p>
                      <p className="text-sm text-muted-foreground">
                        {tutoria.estudiante} → {tutoria.docente}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        tutoria.estado === 'finalizada'
                          ? 'bg-success/10 text-success'
                          : tutoria.estado === 'aceptada'
                          ? 'bg-primary/10 text-primary'
                          : tutoria.estado === 'pendiente'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {tutoria.estado.charAt(0).toUpperCase() + tutoria.estado.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
