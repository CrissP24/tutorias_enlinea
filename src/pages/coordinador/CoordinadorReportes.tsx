import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getTutorias, getUsers } from '@/lib/storage';
import { Download } from 'lucide-react';

const CoordinadorReportes = () => {
  const { user } = useAuth();

  const reportData = useMemo(() => {
    const tutorias = getTutorias().filter(t => {
      const docente = getUsers().find(u => u.id === t.docenteId);
      const estudiante = getUsers().find(u => u.id === t.estudianteId);
      return docente?.carrera === user?.carrera || estudiante?.carrera === user?.carrera;
    });

    const porDocente: { [key: string]: any } = {};
    const porEstudiante: { [key: string]: any } = {};

    tutorias.forEach(t => {
      const docente = getUsers().find(u => u.id === t.docenteId);
      const estudiante = getUsers().find(u => u.id === t.estudianteId);

      if (docente) {
        if (!porDocente[t.docenteId]) {
          porDocente[t.docenteId] = {
            nombre: `${docente.nombres} ${docente.apellidos}`,
            email: docente.email,
            total: 0,
            aceptadas: 0,
            rechazadas: 0,
            finalizadas: 0,
            calificacionPromedio: 0,
            tutoriasConCalificacion: 0,
          };
        }
        porDocente[t.docenteId].total++;
        if (t.estado === 'aceptada') porDocente[t.docenteId].aceptadas++;
        if (t.estado === 'rechazada') porDocente[t.docenteId].rechazadas++;
        if (t.estado === 'finalizada') {
          porDocente[t.docenteId].finalizadas++;
          if (t.calificacion) {
            porDocente[t.docenteId].calificacionPromedio += t.calificacion;
            porDocente[t.docenteId].tutoriasConCalificacion++;
          }
        }
      }

      if (estudiante) {
        if (!porEstudiante[t.estudianteId]) {
          porEstudiante[t.estudianteId] = {
            nombre: `${estudiante.nombres} ${estudiante.apellidos}`,
            email: estudiante.email,
            carrera: estudiante.carrera,
            semestre: estudiante.semestre,
            total: 0,
            aceptadas: 0,
            finalizadas: 0,
            calificacionPromedio: 0,
            tutoriasConCalificacion: 0,
          };
        }
        porEstudiante[t.estudianteId].total++;
        if (t.estado === 'aceptada') porEstudiante[t.estudianteId].aceptadas++;
        if (t.estado === 'finalizada') {
          porEstudiante[t.estudianteId].finalizadas++;
          if (t.calificacion) {
            porEstudiante[t.estudianteId].calificacionPromedio += t.calificacion;
            porEstudiante[t.estudianteId].tutoriasConCalificacion++;
          }
        }
      }
    });

    // Calcular promedios
    Object.values(porDocente).forEach((doc: any) => {
      if (doc.tutoriasConCalificacion > 0) {
        doc.calificacionPromedio = (doc.calificacionPromedio / doc.tutoriasConCalificacion).toFixed(2);
      }
    });

    Object.values(porEstudiante).forEach((est: any) => {
      if (est.tutoriasConCalificacion > 0) {
        est.calificacionPromedio = (est.calificacionPromedio / est.tutoriasConCalificacion).toFixed(2);
      }
    });

    return { porDocente, porEstudiante };
  }, [user?.carrera]);

  const downloadReport = () => {
    const docentes = Object.values(reportData.porDocente);
    const estudiantes = Object.values(reportData.porEstudiante);

    let csv = 'REPORTE DE TUTORÍAS POR CARRERA\n';
    csv += `Carrera: ${user?.carrera}\n`;
    csv += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n`;

    csv += 'DOCENTES\n';
    csv += 'Nombre,Email,Total,Aceptadas,Rechazadas,Finalizadas,Calificación Promedio\n';
    docentes.forEach((doc: any) => {
      csv += `"${doc.nombre}","${doc.email}",${doc.total},${doc.aceptadas},${doc.rechazadas},${doc.finalizadas},${doc.calificacionPromedio}\n`;
    });

    csv += '\n\nESTUDIANTES\n';
    csv += 'Nombre,Email,Carrera,Semestre,Total,Aceptadas,Finalizadas,Calificación Promedio\n';
    estudiantes.forEach((est: any) => {
      csv += `"${est.nombre}","${est.email}","${est.carrera}","${est.semestre}",${est.total},${est.aceptadas},${est.finalizadas},${est.calificacionPromedio}\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `reporte-tutorías-${user?.carrera}-${new Date().getTime()}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reportes por Carrera</h1>
            <p className="text-gray-600 mt-2">Reportes de tutorías - {user?.carrera}</p>
          </div>
          <Button onClick={downloadReport} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Descargar CSV
          </Button>
        </div>

        {/* Docentes */}
        <Card>
          <CardHeader>
            <CardTitle>Desempeño de Docentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Aceptadas</TableHead>
                    <TableHead>Rechazadas</TableHead>
                    <TableHead>Finalizadas</TableHead>
                    <TableHead>Calificación Promedio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(reportData.porDocente).map((doc: any) => (
                    <TableRow key={doc.email}>
                      <TableCell className="font-medium">{doc.nombre}</TableCell>
                      <TableCell>{doc.email}</TableCell>
                      <TableCell>{doc.total}</TableCell>
                      <TableCell className="text-green-600">{doc.aceptadas}</TableCell>
                      <TableCell className="text-red-600">{doc.rechazadas}</TableCell>
                      <TableCell className="text-blue-600">{doc.finalizadas}</TableCell>
                      <TableCell>{doc.calificacionPromedio || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Estudiantes */}
        <Card>
          <CardHeader>
            <CardTitle>Desempeño de Estudiantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Semestre</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Aceptadas</TableHead>
                    <TableHead>Finalizadas</TableHead>
                    <TableHead>Calificación Promedio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(reportData.porEstudiante).map((est: any) => (
                    <TableRow key={est.email}>
                      <TableCell className="font-medium">{est.nombre}</TableCell>
                      <TableCell>{est.email}</TableCell>
                      <TableCell>{est.semestre}</TableCell>
                      <TableCell>{est.total}</TableCell>
                      <TableCell className="text-green-600">{est.aceptadas}</TableCell>
                      <TableCell className="text-blue-600">{est.finalizadas}</TableCell>
                      <TableCell>{est.calificacionPromedio || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CoordinadorReportes;
