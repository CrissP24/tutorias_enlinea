import React, { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUsers, getTutorias } from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from '@/components/ui/star-rating';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Star, TrendingUp, Award, CheckCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { DocenteStats } from '@/types';

const AdminReportes: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCarrera, setSelectedCarrera] = useState<string>('all');

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
        docenteNombre: `${docente.nombres} ${docente.apellidos}`,
        totalTutorias: docenteTutorias.length,
        tutoriasFinalizadas: docenteFinalizadas.length,
        promedioCalificacion: docenteCalificaciones.length > 0
          ? docenteCalificaciones.reduce((a, b) => a + b, 0) / docenteCalificaciones.length
          : 0,
        totalCalificaciones: docenteCalificaciones.length,
      };
    }).sort((a, b) => b.promedioCalificacion - a.promedioCalificacion);

    // Stats por carrera
    const carreras = [...new Set(users.map(u => u.carrera).filter(Boolean))];
    const statsPorCarrera = carreras.map(carrera => {
      const estudiantesCarrera = users.filter(u => u.rol === 'estudiante' && u.carrera === carrera);
      const docentesCarrera = users.filter(u => u.rol === 'docente' && u.carrera === carrera);
      const tutoriasCarrera = tutorias.filter(t => {
        const estudiante = users.find(u => u.id === t.estudianteId);
        const docente = users.find(u => u.id === t.docenteId);
        return estudiante?.carrera === carrera || docente?.carrera === carrera;
      });
      const calificacionesCarrera = tutoriasCarrera
        .filter(t => t.calificacion !== undefined)
        .map(t => t.calificacion!);
      const promedioCarrera = calificacionesCarrera.length > 0
        ? calificacionesCarrera.reduce((a, b) => a + b, 0) / calificacionesCarrera.length
        : 0;

      return {
        carrera,
        totalEstudiantes: estudiantesCarrera.length,
        totalDocentes: docentesCarrera.length,
        totalTutorias: tutoriasCarrera.length,
        tutoriasFinalizadas: tutoriasCarrera.filter(t => t.estado === 'finalizada').length,
        promedioCalificacion: promedioCarrera,
      };
    });

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
      statsPorCarrera,
      carreras,
    };
  }, []);

  const statsFiltradas = useMemo(() => {
    if (selectedCarrera === 'all') return stats;
    
    const users = getUsers();
    const tutorias = getTutorias();
    const tutoriasCarrera = tutorias.filter(t => {
      const estudiante = users.find(u => u.id === t.estudianteId);
      const docente = users.find(u => u.id === t.docenteId);
      return estudiante?.carrera === selectedCarrera || docente?.carrera === selectedCarrera;
    });

    const calificaciones = tutoriasCarrera
      .filter(t => t.calificacion !== undefined)
      .map(t => t.calificacion!);
    const promedio = calificaciones.length > 0
      ? calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length
      : 0;

    // Recalcular docente stats para la carrera seleccionada
    const docentesCarrera = users.filter(u => u.rol === 'docente' && u.carrera === selectedCarrera);
    const docenteStatsFiltradas: DocenteStats[] = docentesCarrera.map(docente => {
      const docenteTutorias = tutoriasCarrera.filter(t => t.docenteId === docente.id);
      const docenteFinalizadas = docenteTutorias.filter(t => t.estado === 'finalizada');
      const docenteCalificaciones = docenteTutorias
        .filter(t => t.calificacion !== undefined)
        .map(t => t.calificacion!);
      
      return {
        docenteId: docente.id,
        docenteNombre: `${docente.nombres} ${docente.apellidos}`,
        totalTutorias: docenteTutorias.length,
        tutoriasFinalizadas: docenteFinalizadas.length,
        promedioCalificacion: docenteCalificaciones.length > 0
          ? docenteCalificaciones.reduce((a, b) => a + b, 0) / docenteCalificaciones.length
          : 0,
        totalCalificaciones: docenteCalificaciones.length,
      };
    }).sort((a, b) => b.promedioCalificacion - a.promedioCalificacion);

    return {
      ...stats,
      totalTutorias: tutoriasCarrera.length,
      pendientes: tutoriasCarrera.filter(t => t.estado === 'pendiente').length,
      aceptadas: tutoriasCarrera.filter(t => t.estado === 'aceptada').length,
      finalizadas: tutoriasCarrera.filter(t => t.estado === 'finalizada').length,
      rechazadas: tutoriasCarrera.filter(t => t.estado === 'rechazada').length,
      promedioGeneral: promedio,
      docenteStats: docenteStatsFiltradas,
    };
  }, [stats, selectedCarrera]);

  if (!user) {
    return null;
  }

  const downloadReportePorCarrera = (carrera: string) => {
    const carreraStats = stats.statsPorCarrera.find(s => s.carrera === carrera);
    if (!carreraStats) return;

    let csv = `REPORTE POR CARRERA: ${carrera}\n`;
    csv += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n`;
    csv += 'ESTADÍSTICAS GENERALES\n';
    csv += `Total de Estudiantes: ${carreraStats.totalEstudiantes}\n`;
    csv += `Total de Docentes: ${carreraStats.totalDocentes}\n`;
    csv += `Total de Tutorías: ${carreraStats.totalTutorias}\n`;
    csv += `Tutorías Finalizadas: ${carreraStats.tutoriasFinalizadas}\n`;
    csv += `Calificación Promedio: ${carreraStats.promedioCalificacion.toFixed(2)}\n`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `reporte-carrera-${carrera}-${new Date().getTime()}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({ title: 'Reporte descargado', description: `Reporte de ${carrera} descargado exitosamente.` });
  };

  const generalCards = [
    {
      title: 'Total Tutorías',
      value: statsFiltradas.totalTutorias,
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Finalizadas',
      value: statsFiltradas.finalizadas,
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Pendientes',
      value: statsFiltradas.pendientes,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Promedio General',
      value: statsFiltradas.promedioGeneral.toFixed(1),
      icon: <Star className="h-5 w-5" />,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reportes y Estadísticas</h1>
            <p className="text-muted-foreground">
              Análisis detallado de la actividad en la plataforma
            </p>
          </div>
          <Select value={selectedCarrera} onValueChange={setSelectedCarrera}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por carrera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las carreras</SelectItem>
              {stats.carreras.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
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
            {statsFiltradas.docenteStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay docentes registrados.
              </p>
            ) : (
              <div className="space-y-4">
                {statsFiltradas.docenteStats.map((docente, index) => (
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

        {/* Reportes por Carrera */}
        <Card>
          <CardHeader>
            <CardTitle>Reportes por Carrera</CardTitle>
            <CardDescription>
              Estadísticas detalladas por cada carrera del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.statsPorCarrera.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay carreras registradas.
              </p>
            ) : (
              <div className="space-y-4">
                {stats.statsPorCarrera.map((carreraStat) => (
                  <div
                    key={carreraStat.carrera}
                    className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-foreground">{carreraStat.carrera}</h3>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-muted-foreground sm:grid-cols-4">
                        <div>
                          <span className="font-medium">Estudiantes:</span> {carreraStat.totalEstudiantes}
                        </div>
                        <div>
                          <span className="font-medium">Docentes:</span> {carreraStat.totalDocentes}
                        </div>
                        <div>
                          <span className="font-medium">Tutorías:</span> {carreraStat.totalTutorias}
                        </div>
                        <div>
                          <span className="font-medium">Promedio:</span> {carreraStat.promedioCalificacion.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReportePorCarrera(carreraStat.carrera)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar Reporte
                    </Button>
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
              <span className="text-3xl font-bold">{statsFiltradas.promedioGeneral.toFixed(1)}</span>
              <span className="text-primary-foreground/80">/ 5.0 promedio general</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminReportes;
