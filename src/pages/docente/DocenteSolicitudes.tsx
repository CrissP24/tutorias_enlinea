import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTutoriasByDocente, updateTutoria, getUsers, createMensaje, createNotification } from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Check, X, Calendar, Clock, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Tutoria } from '@/types';

const DocenteSolicitudes: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tutorias, setTutorias] = useState<Tutoria[]>(() => user ? getTutoriasByDocente(user.id) : []);
  const [rejectComment, setRejectComment] = useState('');
  const [selectedTutoriaId, setSelectedTutoriaId] = useState<string | null>(null);
  const users = useMemo(() => getUsers(), []);
  const getUserName = (id: string) => {
    const u = users.find(u => u.id === id);
    return u ? `${u.nombres} ${u.apellidos}` : 'Desconocido';
  };

  const refresh = () => user && setTutorias(getTutoriasByDocente(user.id));

  const handleAccept = (id: string) => {
    if (updateTutoria(id, { estado: 'aceptada' })) {
      toast({ title: 'Tutoría aceptada', description: 'El estudiante ha sido notificado.' });
      // Crear notificación para el estudiante
      const tutoria = tutorias.find(t => t.id === id);
      if (tutoria) {
        createNotification({
          userId: tutoria.estudianteId,
          mensaje: `Tu solicitud de tutoría sobre "${tutoria.tema}" ha sido aceptada`,
          tipo: 'aceptada',
          tutoriaId: id,
        });
      }
      refresh();
    }
  };

  const handleReject = (id: string, comment: string) => {
    if (updateTutoria(id, { estado: 'rechazada' })) {
      toast({ title: 'Tutoría rechazada', description: 'El estudiante ha sido notificado con tu comentario.' });
      
      // Crear notificación con comentario para el estudiante
      const tutoria = tutorias.find(t => t.id === id);
      if (tutoria) {
        createNotification({
          userId: tutoria.estudianteId,
          mensaje: `Tu solicitud de tutoría sobre "${tutoria.tema}" ha sido rechazada. ${comment ? `Comentario: ${comment}` : ''}`,
          tipo: 'rechazada',
          tutoriaId: id,
        });
        
        // Crear un mensaje en la tutoria para que el estudiante lo vea
        if (comment) {
          createMensaje({
            tutoriaId: id,
            remitente: user?.id || '',
            contenido: `Rechazado. Motivo: ${comment}`,
          });
        }
      }
      setRejectComment('');
      setSelectedTutoriaId(null);
      refresh();
    }
  };

  const pendientes = tutorias.filter(t => t.estado === 'pendiente');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Solicitudes de Tutoría</h1>
          <p className="text-gray-600 mt-2">Revisa y responde a las solicitudes de tutoría de tus estudiantes</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{pendientes.length} solicitud(es) pendiente(s)</CardTitle>
          </CardHeader>
          <CardContent>
            {pendientes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay solicitudes pendientes.</p>
            ) : (
              <div className="space-y-4">
                {pendientes.map(t => (
                  <div key={t.id} className="rounded-xl border p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{t.tema}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{t.descripcion}</p>
                        <p className="text-sm mt-2"><strong>Estudiante:</strong> {getUserName(t.estudianteId)}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground mt-3">
                          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(t.fecha).toLocaleDateString('es-ES')}</span>
                          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{t.hora}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          variant="default"
                          onClick={() => handleAccept(t.id)}
                          className="gap-1"
                        >
                          <Check className="h-4 w-4" />
                          Aceptar
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="destructive"
                              className="gap-1"
                              onClick={() => setSelectedTutoriaId(t.id)}
                            >
                              <X className="h-4 w-4" />
                              Rechazar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Rechazar Solicitud de Tutoría</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <p className="text-sm text-gray-600">
                                  Tema: <strong>{t.tema}</strong>
                                </p>
                                <p className="text-sm text-gray-600 mt-2">
                                  Estudiante: <strong>{getUserName(t.estudianteId)}</strong>
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="reject-reason">Motivo del rechazo (opcional)</Label>
                                <Textarea 
                                  id="reject-reason"
                                  placeholder="Ej: La fecha no está disponible, se puede reprogramar para..."
                                  value={rejectComment}
                                  onChange={(e) => setRejectComment(e.target.value)}
                                  className="min-h-24"
                                />
                                <p className="text-xs text-gray-500">
                                  Este comentario será enviado al estudiante para que pueda reprogramar o entender el motivo.
                                </p>
                              </div>
                              <div className="flex gap-3">
                                <Button 
                                  className="flex-1"
                                  onClick={() => handleReject(t.id, rejectComment)}
                                >
                                  Rechazar
                                </Button>
                                <Button variant="outline" className="flex-1">
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
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

export default DocenteSolicitudes;
