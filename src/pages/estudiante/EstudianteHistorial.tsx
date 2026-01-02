import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTutoriasByEstudiante, updateTutoria, getUsers } from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/ui/status-badge';
import { StarRating } from '@/components/ui/star-rating';
import { useToast } from '@/hooks/use-toast';
import type { Tutoria } from '@/types';

const EstudianteHistorial: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tutorias, setTutorias] = useState<Tutoria[]>(() => user ? getTutoriasByEstudiante(user.id) : []);
  const users = useMemo(() => getUsers(), []);
  const getUserName = (id: string) => users.find(u => u.id === id)?.nombre || 'Desconocido';

  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [selectedTutoria, setSelectedTutoria] = useState<Tutoria | null>(null);
  const [rating, setRating] = useState(5);
  const [comentario, setComentario] = useState('');

  const refresh = () => user && setTutorias(getTutoriasByEstudiante(user.id));

  const openRating = (t: Tutoria) => {
    setSelectedTutoria(t);
    setRating(t.calificacion || 5);
    setComentario(t.comentario || '');
    setIsRatingOpen(true);
  };

  const handleRate = () => {
    if (!selectedTutoria) return;
    updateTutoria(selectedTutoria.id, { calificacion: rating, comentario, estado: 'finalizada' });
    toast({ title: '¡Calificación enviada!' });
    refresh();
    setIsRatingOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Mis Tutorías</h1>
        <Card>
          <CardHeader><CardTitle>{tutorias.length} tutoría(s)</CardTitle></CardHeader>
          <CardContent>
            {tutorias.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No tienes tutorías aún.</p>
            ) : (
              <div className="space-y-4">
                {tutorias.map(t => (
                  <div key={t.id} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{t.tema}</h3>
                          <StatusBadge status={t.estado} size="sm" />
                        </div>
                        <p className="text-sm text-muted-foreground">Docente: {getUserName(t.docenteId)}</p>
                        {t.calificacion && <StarRating value={t.calificacion} readonly size="sm" />}
                      </div>
                      {t.estado === 'aceptada' && !t.calificacion && (
                        <Button onClick={() => openRating(t)}>Calificar</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isRatingOpen} onOpenChange={setIsRatingOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Calificar Tutoría</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-center"><StarRating value={rating} onChange={setRating} size="lg" /></div>
              <Textarea placeholder="Comentario opcional..." value={comentario} onChange={(e) => setComentario(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRatingOpen(false)}>Cancelar</Button>
              <Button onClick={handleRate}>Enviar Calificación</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default EstudianteHistorial;
