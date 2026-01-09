import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getTutorias, updateTutoria, getUsers, getMensajesByTutoria } from '@/lib/storage';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Clock } from 'lucide-react';

const CoordinadorTutorias = () => {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTutoria, setSelectedTutoria] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!user) {
    return null;
  }

  const tutorias = useMemo(() => {
    return getTutorias().filter(t => {
      const docente = getUsers().find(u => u.id === t.docenteId);
      const estudiante = getUsers().find(u => u.id === t.estudianteId);
      
      const isInCarrera = docente?.carrera === user?.carrera || estudiante?.carrera === user?.carrera;
      if (!isInCarrera) return false;

      if (filterStatus !== 'all' && t.estado !== filterStatus) return false;

      const searchLower = searchTerm.toLowerCase();
      return (
        (t.tema || '').toLowerCase().includes(searchLower) ||
        (estudiante?.nombres || '').toLowerCase().includes(searchLower) ||
        (docente?.nombres || '').toLowerCase().includes(searchLower)
      );
    });
  }, [user?.carrera, filterStatus, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'aceptada':
        return 'bg-green-100 text-green-800';
      case 'rechazada':
        return 'bg-red-100 text-red-800';
      case 'finalizada':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Tutorías</h1>
          <p className="text-gray-600 mt-2">Monitorea todas las tutorías de tu carrera</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Buscar por tema, estudiante o docente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="aceptada">Aceptada</SelectItem>
              <SelectItem value="rechazada">Rechazada</SelectItem>
              <SelectItem value="finalizada">Finalizada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tutorias List */}
        <div className="space-y-4">
          {tutorias.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No hay tutorías que mostrar</p>
              </CardContent>
            </Card>
          ) : (
            tutorias.map((tutoria) => {
              const docente = getUsers().find(u => u.id === tutoria.docenteId);
              const estudiante = getUsers().find(u => u.id === tutoria.estudianteId);
              const mensajes = getMensajesByTutoria(tutoria.id);

              return (
                <Card key={tutoria.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{tutoria.tema || 'Sin tema'}</h3>
                          <Badge className={getStatusColor(tutoria.estado)}>
                            {tutoria.estado || 'pendiente'}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{tutoria.descripcion || 'Sin descripción'}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Docente</p>
                            <p className="font-medium">
                              {docente ? `${docente.nombres || ''} ${docente.apellidos || ''}`.trim() || 'Desconocido' : 'Desconocido'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Estudiante</p>
                            <p className="font-medium">
                              {estudiante ? `${estudiante.nombres || ''} ${estudiante.apellidos || ''}`.trim() || 'Desconocido' : 'Desconocido'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Fecha</p>
                            <p className="font-medium">{tutoria.fecha || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Hora</p>
                            <p className="font-medium">{tutoria.hora || '-'}</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTutoria(tutoria);
                          setIsDialogOpen(true);
                        }}
                        className="flex items-center gap-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Ver Detalles
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Dialog de Detalles */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedTutoria && (() => {
              const docente = getUsers().find(u => u.id === selectedTutoria.docenteId);
              const estudiante = getUsers().find(u => u.id === selectedTutoria.estudianteId);
              const mensajes = getMensajesByTutoria(selectedTutoria.id);
              
              return (
                <>
                  <DialogHeader>
                    <DialogTitle>Detalles de Tutoría - {selectedTutoria.tema || 'Sin tema'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 font-medium">Docente:</p>
                          <p>{docente ? `${docente.nombres || ''} ${docente.apellidos || ''}`.trim() || 'Desconocido' : 'Desconocido'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Estudiante:</p>
                          <p>{estudiante ? `${estudiante.nombres || ''} ${estudiante.apellidos || ''}`.trim() || 'Desconocido' : 'Desconocido'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Fecha:</p>
                          <p>{selectedTutoria.fecha || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Hora:</p>
                          <p>{selectedTutoria.hora || '-'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500 font-medium">Estado:</p>
                          <Badge className={getStatusColor(selectedTutoria.estado)}>
                            {selectedTutoria.estado || 'pendiente'}
                          </Badge>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500 font-medium">Descripción:</p>
                          <p>{selectedTutoria.descripcion || 'Sin descripción'}</p>
                        </div>
                        {selectedTutoria.calificacion && (
                          <div className="col-span-2">
                            <p className="text-gray-500 font-medium">Calificación:</p>
                            <p className="text-lg font-semibold">{selectedTutoria.calificacion} / 5</p>
                            {selectedTutoria.comentario && (
                              <p className="text-sm text-gray-600 mt-1 italic">"{selectedTutoria.comentario}"</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Mensajes ({mensajes.length})</h4>
                      {mensajes.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">Sin mensajes</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {mensajes.map(msg => {
                            const remitente = getUsers().find(u => u.id === msg.remitente);
                            return (
                              <div key={msg.id} className="bg-gray-50 p-3 rounded">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm">
                                    {remitente ? `${remitente.nombres || ''} ${remitente.apellidos || ''}`.trim() || 'Desconocido' : 'Desconocido'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(msg.fecha).toLocaleString('es-ES')}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">{msg.contenido || 'Sin contenido'}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CoordinadorTutorias;
