import React, { useMemo } from 'react';
import { getUsers, getTutorias } from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from '@/components/ui/star-rating';
import { BookOpen, Users, Star, TrendingUp, Award, CheckCircle } from 'lucide-react';
import type { DocenteStats } from '@/types';

const AdminReportes: React.FC = () => {
  const stats = useMemo(() => {
    const users = getUsers();
    const tutorias = getTutorias();

    // General stats
    const totalTutorias = tutorias.length;
    const pendientes = tutorias.filter(t => t.estado === 'pendiente').length;
    const aceptadas = tutorias.filter(t => t.estado === 'aceptada').length;
    const finalizadas = tutorias.filter(t => t.estado === 'finalizada').length;
    const rechazadas = tutorias.filter(t => t.estado === 'rechazada').length;

    // Average rating
    const calificaciones = tutorias
      .filter(t => t.calificacion !== undefined)
      .map(t => t.calificacion!);
    const promedioGeneral = calificaciones.length > 0
      ? calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length
      : 0;

    // Per docente stats
    const docentes = users.filter(u => u.rol === 'docente');
    const docenteStats: DocenteStats[] = docentes.map(docente => {
      const docenteTutorias = tutorias.filter(t => t.docenteId === docente.id);
      const docenteFinalizadas = docenteTutorias.filter(t => t.estado === 'finalizada');
      const docenteCalificaciones = docenteTutorias
        .filter(t => t.calificacion !== undefined)
        .map(t => t.calificacion!);
      
      return {
        docenteId: docente.id,
        docenteNombre: docente.nombre,
        totalTutorias: docenteTutorias.length,
        tutoriasFinalizadas: docenteFinalizadas.length,
        promedioCalificacion: docenteCalificaciones.length > 0
          ? docenteCalificaciones.reduce((a, b) => a + b, 0) / docenteCalificaciones.length
          : 0,
        totalCalificaciones: docenteCalificaciones.length,
      };
    }).sort((a, b) => b.promedioCalificacion - a.promedioCalificacion);

    return {
      totalTutorias,
      pendientes,
      aceptadas,
      finalizadas,
      rechazadas,
      promedioGeneral,
      docenteStats,
      totalEstudiantes: users.filter(u => u.rol === 'estudiante').length,
      totalDocentes: docentes.length,
    };
  }, []);

  const generalCards = [
    {
      title: 'Total Tutorías',
      value: stats.totalTutorias,
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Finalizadas',
      value: stats.finalizadas,
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Pendientes',
      value: stats.pendientes,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Promedio General',
      value: stats.promedioGeneral.toFixed(1),
      icon: <Star className="h-5 w-5" />,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reportes y Estadísticas</h1>
          <p className="text-muted-foreground">
            Análisis detallado de la actividad en la plataforma
          </p>
        </div>

        {/* General Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {generalCards.map((stat, index) => (
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

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Estado</CardTitle>
            <CardDescription>
              Resumen de tutorías por estado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Pendientes', value: stats.pendientes, color: 'bg-accent/20 border-accent/30' },
                { label: 'Aceptadas', value: stats.aceptadas, color: 'bg-primary/20 border-primary/30' },
                { label: 'Finalizadas', value: stats.finalizadas, color: 'bg-success/20 border-success/30' },
                { label: 'Rechazadas', value: stats.rechazadas, color: 'bg-destructive/20 border-destructive/30' },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`rounded-xl border-2 p-4 text-center ${item.color}`}
                >
                  <p className="text-3xl font-bold text-foreground">{item.value}</p>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Docente Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" />
              Rendimiento por Docente
            </CardTitle>
            <CardDescription>
              Estadísticas detalladas de cada docente ordenadas por calificación
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.docenteStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay docentes registrados.
              </p>
            ) : (
              <div className="space-y-4">
                {stats.docenteStats.map((docente, index) => (
                  <div
                    key={docente.docenteId}
                    className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{docente.docenteNombre}</h3>
                        <p className="text-sm text-muted-foreground">
                          {docente.totalTutorias} tutorías totales · {docente.tutoriasFinalizadas} finalizadas
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <StarRating value={Math.round(docente.promedioCalificacion)} readonly size="sm" />
                          <span className="font-semibold text-foreground">
                            {docente.promedioCalificacion.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {docente.totalCalificaciones} calificación(es)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="gradient-hero text-primary-foreground">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <h2 className="mb-2 text-2xl font-bold">Resumen de la Plataforma</h2>
            <p className="mb-4 text-primary-foreground/80">
              {stats.totalEstudiantes} estudiantes y {stats.totalDocentes} docentes activos
            </p>
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 fill-accent text-accent" />
              <span className="text-3xl font-bold">{stats.promedioGeneral.toFixed(1)}</span>
              <span className="text-primary-foreground/80">/ 5.0 promedio general</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminReportes;
