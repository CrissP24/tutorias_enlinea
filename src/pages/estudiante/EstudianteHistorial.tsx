import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTutoriasByEstudiante, updateTutoria, getUsers, getMensajesByTutoria, createMensaje, createNotification } from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/ui/status-badge';
import { StarRating } from '@/components/ui/star-rating';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, MessageSquare, Edit2, Download } from 'lucide-react';
import type { Tutoria } from '@/types';

const EstudianteHistorial: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tutorias, setTutorias] = useState<Tutoria[]>(() => user ? getTutoriasByEstudiante(user.id) : []);
  const users = useMemo(() => getUsers(), []);
  const getUserName = (id: string) => {
    const u = users.find(u => u.id === id);
    return u ? `${u.nombres} ${u.apellidos}` : 'Desconocido';
  };

  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [selectedTutoria, setSelectedTutoria] = useState<Tutoria | null>(null);
  const [rating, setRating] = useState(5);
  const [comentario, setComentario] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [editData, setEditData] = useState({ fecha: '', hora: '' });
  const [mensajes, setMensajes] = useState<any[]>([]);

  const refresh = () => user && setTutorias(getTutoriasByEstudiante(user.id));

  const openRating = (t: Tutoria) => {
    setSelectedTutoria(t);
    setRating(t.calificacion || 5);
    setComentario(t.comentario || '');
    setIsRatingOpen(true);
  };

  const openEdit = (t: Tutoria) => {
    setSelectedTutoria(t);
    setEditData({ fecha: t.fecha, hora: t.hora });
    setIsEditOpen(true);
  };

  const openMessages = (t: Tutoria) => {
    setSelectedTutoria(t);
    setMensajes(getMensajesByTutoria(t.id));
    setIsMessagesOpen(true);
  };

  const handleRate = () => {
    if (!selectedTutoria) return;
    if (updateTutoria(selectedTutoria.id, { calificacion: rating, comentario, estado: 'finalizada' })) {
      toast({ title: '¡Calificación enviada!' });
      refresh();
      setIsRatingOpen(false);
    }
  };

  const handleEditTutoria = () => {
    if (!selectedTutoria) return;
    if (updateTutoria(selectedTutoria.id, { fecha: editData.fecha, hora: editData.hora })) {
      toast({ title: 'Tutoria actualizada', description: 'La fecha y hora han sido modificadas.' });
      
      // Notificar al docente
      createNotification({
        userId: selectedTutoria.docenteId,
        mensaje: `El estudiante ha modificado la fecha/hora de la tutoría "${selectedTutoria.tema}" a ${editData.fecha} ${editData.hora}`,
        tipo: 'reprogramada',
        tutoriaId: selectedTutoria.id,
      });
      
      refresh();
      setIsEditOpen(false);
    }
  };

  const handleSendMessage = () => {
    if (!selectedTutoria || !newMessage.trim()) return;
    if (user) {
      createMensaje({
        tutoriaId: selectedTutoria.id,
        remitente: user.id,
        contenido: newMessage,
      });
      
      // Notificar al docente
      createNotification({
        userId: selectedTutoria.docenteId,
        mensaje: `Nuevo mensaje en la tutoría "${selectedTutoria.tema}"`,
        tipo: 'mensaje',
        tutoriaId: selectedTutoria.id,
      });
      
      setNewMessage('');
      setMensajes(getMensajesByTutoria(selectedTutoria.id));
      toast({ title: 'Mensaje enviado' });
    }
  };

  const downloadReport = () => {
    if (!user) return;
    let csv = 'REPORTE DE TUTORÍAS\n';
    csv += `Estudiante: ${user.nombres} ${user.apellidos}\n`;
    csv += `Carrera: ${user.carrera}\n`;
    csv += `Semestre: ${user.semestre}\n`;
    csv += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n`;
    csv += 'Tema,Docente,Fecha,Hora,Estado,Calificación\n';
    
    tutorias.forEach(t => {
      const docente = users.find(u => u.id === t.docenteId)?.nombres || 'Desconocido';
      csv += `"${t.tema}","${docente}","${t.fecha}","${t.hora}","${t.estado}","${t.calificacion || '-'}"\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `reporte-tutorias-${user.nombres}-${new Date().getTime()}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({ title: 'Reporte descargado' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mis Tutorías</h1>
            <p className="text-gray-600 mt-1">Gestiona tus tutorías y consulta tus calificaciones</p>
          </div>
          <Button onClick={downloadReport} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Descargar Reporte
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle>{tutorias.length} tutoría(s)</CardTitle></CardHeader>
          <CardContent>
            {tutorias.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No tienes tutorías aún.</p>
            ) : (
              <div className="space-y-4">
                {tutorias.map(t => (
                  <div key={t.id} className="rounded-xl border p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{t.tema}</h3>
                            <StatusBadge status={t.estado} size="sm" />
                          </div>
                          <p className="text-sm text-muted-foreground">Docente: {getUserName(t.docenteId)}</p>
                          <div className="flex gap-4 text-sm text-muted-foreground mt-3">
                            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{t.fecha}</span>
                            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{t.hora}</span>
                          </div>
                          {t.descripcion && <p className="text-sm text-gray-600 mt-2">{t.descripcion}</p>}
                          {t.calificacion && (
                            <div className="mt-3">
                              <StarRating value={t.calificacion} readonly size="sm" />
                              {t.comentario && <p className="text-sm mt-1 text-gray-600">{t.comentario}</p>}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Acciones basadas en estado */}
                      <div className="flex gap-2 flex-wrap pt-2 border-t">
                        {t.estado === 'aceptada' && !t.calificacion && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => openRating(t)}
                          >
                            Calificar
                          </Button>
                        )}
                        {(t.estado === 'pendiente' || t.estado === 'aceptada') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEdit(t)}
                            className="gap-1"
                          >
                            <Edit2 className="h-4 w-4" />
                            Modificar Fecha/Hora
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openMessages(t)}
                          className="gap-1"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Mensajes
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog Calificar */}
        <Dialog open={isRatingOpen} onOpenChange={setIsRatingOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Calificar Tutoría</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-gray-600">Tema: <strong>{selectedTutoria?.tema}</strong></p>
              </div>
              <div>
                <Label>Calificación</Label>
                <div className="flex justify-center mt-3"><StarRating value={rating} onChange={setRating} size="lg" /></div>
              </div>
              <div>
                <Label htmlFor="comment">Comentario (opcional)</Label>
                <Textarea 
                  id="comment"
                  placeholder="Comparte tu experiencia con esta tutoría..." 
                  value={comentario} 
                  onChange={(e) => setComentario(e.target.value)} 
                  className="mt-2 min-h-20"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRatingOpen(false)}>Cancelar</Button>
              <Button onClick={handleRate}>Enviar Calificación</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Editar */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Modificar Fecha y Hora</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-gray-600">Tema: <strong>{selectedTutoria?.tema}</strong></p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input 
                    id="fecha"
                    type="date" 
                    value={editData.fecha} 
                    onChange={(e) => setEditData({ ...editData, fecha: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora">Hora</Label>
                  <Input 
                    id="hora"
                    type="time" 
                    value={editData.hora} 
                    onChange={(e) => setEditData({ ...editData, hora: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button onClick={handleEditTutoria}>Actualizar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Mensajes */}
        <Dialog open={isMessagesOpen} onOpenChange={setIsMessagesOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Conversación - {selectedTutoria?.tema}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-3 rounded max-h-48 overflow-y-auto space-y-2 mb-4">
                {mensajes.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Sin mensajes</p>
                ) : (
                  mensajes.map(msg => {
                    const remitente = users.find(u => u.id === msg.remitente);
                    const esDelDocente = msg.remitente === selectedTutoria?.docenteId;
                    return (
                      <div key={msg.id} className={`${esDelDocente ? 'bg-blue-50' : 'bg-white'} p-2 rounded border text-sm`}>
                        <div className="flex justify-between">
                          <p className="font-medium text-xs">{remitente?.nombres}</p>
                          <p className="text-xs text-gray-500">{new Date(msg.fecha).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        <p className="mt-1 text-gray-700">{msg.contenido}</p>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex gap-2">
                <Textarea 
                  placeholder="Escribe un mensaje..." 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  className="min-h-16 resize-none"
                />
                <Button 
                  variant="default"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="h-auto"
                >
                  Enviar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default EstudianteHistorial;
