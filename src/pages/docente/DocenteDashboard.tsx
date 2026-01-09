import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTutoriasByDocente, getUsers } from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Star, Clock, CheckCircle, ArrowRight } from 'lucide-react';

const DocenteDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const stats = useMemo(() => {
    if (!user) return { total: 0, pendientes: 0, aceptadas: 0, finalizadas: 0, promedio: 0 };
    const tutorias = getTutoriasByDocente(user.id);
    const calificaciones = tutorias.filter(t => t.calificacion).map(t => t.calificacion!);
    return {
      total: tutorias.length,
      pendientes: tutorias.filter(t => t.estado === 'pendiente').length,
      aceptadas: tutorias.filter(t => t.estado === 'aceptada').length,
      finalizadas: tutorias.filter(t => t.estado === 'finalizada').length,
      promedio: calificaciones.length ? calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length : 0,
    };
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-2xl gradient-hero p-6 text-primary-foreground">
          <h1 className="text-2xl font-bold">¡Bienvenido, {user?.nombres}!</h1>
          <p className="mt-1 text-primary-foreground/80">Gestiona tus tutorías y estudiantes</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Pendientes', value: stats.pendientes, icon: <Clock />, color: 'text-accent bg-accent/10' },
            { title: 'Aceptadas', value: stats.aceptadas, icon: <BookOpen />, color: 'text-primary bg-primary/10' },
            { title: 'Finalizadas', value: stats.finalizadas, icon: <CheckCircle />, color: 'text-success bg-success/10' },
            { title: 'Promedio', value: stats.promedio.toFixed(1), icon: <Star />, color: 'text-accent bg-accent/10' },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>{stat.icon}</div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Solicitudes Pendientes</CardTitle></CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/docente/solicitudes">Ver solicitudes <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Mis Calificaciones</CardTitle></CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/docente/calificaciones">Ver calificaciones <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DocenteDashboard;
