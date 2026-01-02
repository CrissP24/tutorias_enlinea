import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTutoriasByEstudiante } from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, CheckCircle, Plus, ArrowRight } from 'lucide-react';

const EstudianteDashboard: React.FC = () => {
  const { user } = useAuth();
  const stats = useMemo(() => {
    if (!user) return { total: 0, pendientes: 0, aceptadas: 0, finalizadas: 0 };
    const tutorias = getTutoriasByEstudiante(user.id);
    return {
      total: tutorias.length,
      pendientes: tutorias.filter(t => t.estado === 'pendiente').length,
      aceptadas: tutorias.filter(t => t.estado === 'aceptada').length,
      finalizadas: tutorias.filter(t => t.estado === 'finalizada').length,
    };
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-2xl gradient-hero p-6 text-primary-foreground">
          <h1 className="text-2xl font-bold">¡Bienvenido, {user?.nombre}!</h1>
          <p className="mt-1 text-primary-foreground/80">Panel de estudiante</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: 'Pendientes', value: stats.pendientes, icon: <Clock />, color: 'text-accent bg-accent/10' },
            { title: 'Aceptadas', value: stats.aceptadas, icon: <BookOpen />, color: 'text-primary bg-primary/10' },
            { title: 'Finalizadas', value: stats.finalizadas, icon: <CheckCircle />, color: 'text-success bg-success/10' },
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
          <Card className="border-primary/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Solicitar Tutoría</CardTitle></CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/estudiante/solicitar">Nueva solicitud <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Mis Tutorías</CardTitle></CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/estudiante/historial">Ver historial <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EstudianteDashboard;
