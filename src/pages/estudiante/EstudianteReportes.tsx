import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTutoriasByEstudiante, getUsers } from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, BookOpen, Star, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const EstudianteReportes: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user) {
    return null;
  }

  const stats = useMemo(() => {
    if (!user) return { total: 0, pendientes: 0, aceptadas: 0, finalizadas: 0, promedio: 0 };
    const tutorias = getTutoriasByEstudiante(user.id);
    const calificaciones = tutorias.filter(t => t.calificacion).map(t => t.calificacion!);
    return {
      total: tutorias.length,
      pendientes: tutorias.filter(t => t.estado === 'pendiente').length,
      aceptadas: tutorias.filter(t => t.estado === 'aceptada').length,
      finalizadas: tutorias.filter(t => t.estado === 'finalizada').length,
      promedio: calificaciones.length ? calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length : 0,
    };
  }, [user]);

  const tutorias = useMemo(() => {
    if (!user) return [];
    return getTutoriasByEstudiante(user.id);
  }, [user]);

  const users = useMemo(() => getUsers(), []);

  const downloadReport = () => {
    if (!user) return;
    let csv = 'REPORTE PERSONAL DE TUTORÍAS\n';
    csv += `Estudiante: ${user.nombres} ${user.apellidos}\n`;
    csv += `Cédula: ${user.cedula}\n`;
    csv += `Email: ${user.email}\n`;
    csv += `Carrera: ${user.carrera}\n`;
    csv += `Semestre: ${user.semestre}\n`;
    csv += `Fecha del Reporte: ${new Date().toLocaleDateString('es-ES')}\n\n`;
    
    csv += 'RESUMEN\n';
    csv += `Total de Tutorías: ${stats.total}\n`;
    csv += `Pendientes: ${stats.pendientes}\n`;
    csv += `Aceptadas: ${stats.aceptadas}\n`;
    csv += `Finalizadas: ${stats.finalizadas}\n`;
    csv += `Calificación Promedio: ${stats.promedio.toFixed(2)}\n\n`;
    
    csv += 'DETALLE DE TUTORÍAS\n';
    csv += 'Tema,Docente,Fecha,Hora,Estado,Calificación,Comentario\n';
    
    tutorias.forEach(t => {
      const docente = users.find(u => u.id === t.docenteId);
      const docenteNombre = docente ? `${docente.nombres} ${docente.apellidos}` : 'Desconocido';
      csv += `"${t.tema}","${docenteNombre}","${t.fecha}","${t.hora}","${t.estado}","${t.calificacion || '-'}","${t.comentario || '-'}"\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `reporte-tutorias-${user.nombres}-${new Date().getTime()}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({ title: 'Reporte descargado', description: 'El reporte se ha descargado exitosamente.' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mis Reportes</h1>
            <p className="text-muted-foreground">Reporte personal de tus tutorías</p>
          </div>
          <Button onClick={downloadReport}>
            <Download className="mr-2 h-4 w-4" />
            Descargar Reporte
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{stats.pendientes}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Finalizadas</p>
                <p className="text-2xl font-bold">{stats.finalizadas}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Promedio</p>
                <p className="text-2xl font-bold">{stats.promedio.toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de Tutorías</CardTitle>
            <CardDescription>Estadísticas detalladas de tus tutorías</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total de tutorías solicitadas:</span>
                <span className="font-semibold">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tutorías pendientes:</span>
                <span className="font-semibold">{stats.pendientes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tutorías aceptadas:</span>
                <span className="font-semibold">{stats.aceptadas}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tutorías finalizadas:</span>
                <span className="font-semibold">{stats.finalizadas}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Calificación promedio:</span>
                <span className="font-semibold">{stats.promedio.toFixed(2)} / 5.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EstudianteReportes;

