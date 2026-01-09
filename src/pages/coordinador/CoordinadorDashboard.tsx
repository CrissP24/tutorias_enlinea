import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  GraduationCap,
  ArrowRight 
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getTutorias, getUsersByCarrera, getUsers } from '@/lib/storage';

const CoordinadorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const tutorias = getTutorias();
  const estudiantes = getUsersByCarrera(user?.carrera || '').filter(u => u.rol === 'estudiante');
  const docentes = getUsersByCarrera(user?.carrera || '').filter(u => u.rol === 'docente');

  const tutoriasCarrera = tutorias.filter(t => {
    const docente = getUsers().find(u => u.id === t.docenteId);
    return docente?.carrera === user?.carrera;
  });

  const tutoriasPendientes = tutoriasCarrera.filter(t => t.estado === 'pendiente').length;
  const tutoriasAceptadas = tutoriasCarrera.filter(t => t.estado === 'aceptada').length;
  const tutoriasFinalizadas = tutoriasCarrera.filter(t => t.estado === 'finalizada').length;

  const stats = [
    {
      title: 'Estudiantes',
      value: estudiantes.length,
      icon: Users,
      color: 'bg-blue-500',
      action: () => navigate('/coordinador/tutorias'),
    },
    {
      title: 'Docentes',
      value: docentes.length,
      icon: GraduationCap,
      color: 'bg-purple-500',
      action: () => navigate('/coordinador/tutorias'),
    },
    {
      title: 'Tutorías Pendientes',
      value: tutoriasPendientes,
      icon: BookOpen,
      color: 'bg-yellow-500',
      action: () => navigate('/coordinador/tutorias'),
    },
    {
      title: 'Tutorías Aceptadas',
      value: tutoriasAceptadas,
      icon: BookOpen,
      color: 'bg-green-500',
      action: () => navigate('/coordinador/tutorias'),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bienvenido, {user?.nombres}</h1>
          <p className="text-gray-600 mt-2">Panel de Coordinador - {user?.carrera}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.title} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={stat.action}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                    {stat.title}
                    <Icon className={`w-5 h-5 text-white p-1 rounded-full ${stat.color}`} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-xs text-gray-500 mt-1">en tu carrera</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Gestionar Tutorías
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Ver y monitorear todas las tutorías de tu carrera, aprobadas por docentes y estudiantes.
              </p>
              <Button 
                onClick={() => navigate('/coordinador/tutorias')}
                className="w-full"
              >
                Ir a Tutorías <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Carga Masiva
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Carga estudiantes de tu carrera mediante archivo Excel.
              </p>
              <Button 
                onClick={() => navigate('/coordinador/carga-masiva')}
                className="w-full"
              >
                Ir a Carga Masiva <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Reportes por Carrera
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Genera reportes detallados de las tutorías de tu carrera y el desempeño de docentes y estudiantes.
              </p>
              <Button 
                onClick={() => navigate('/coordinador/reportes')}
                className="w-full"
              >
                Ver Reportes <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Tutorías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{tutoriasPendientes}</div>
                <p className="text-sm text-gray-600">Pendientes</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{tutoriasAceptadas}</div>
                <p className="text-sm text-gray-600">Aceptadas</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{tutoriasFinalizadas}</div>
                <p className="text-sm text-gray-600">Finalizadas</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{tutoriasCarrera.length}</div>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CoordinadorDashboard;
