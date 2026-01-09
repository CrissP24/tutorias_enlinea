import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTutorias, getUserById, updateTutoria } from '@/lib/storage';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Clock, User, BookOpen, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tutoria, TutoriaStatus } from '@/types';
import { createNotification } from '@/lib/storage';

interface TutoriasCalendarProps {
  filterByUser?: string;
  filterByRole?: 'estudiante' | 'docente';
}

const TutoriasCalendar: React.FC<TutoriasCalendarProps> = ({ filterByUser, filterByRole }) => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTutoria, setSelectedTutoria] = useState<Tutoria | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ fecha: '', hora: '' });

  // Get all tutorias filtered by user if needed
  const tutorias = useMemo(() => {
    let allTutorias = getTutorias();
    
    if (filterByUser && filterByRole) {
      if (filterByRole === 'estudiante') {
        allTutorias = allTutorias.filter(t => t.estudianteId === filterByUser);
      } else if (filterByRole === 'docente') {
        allTutorias = allTutorias.filter(t => t.docenteId === filterByUser);
      }
    } else if (user) {
      // Default filtering based on current user role
      if (user.rol === 'estudiante') {
        allTutorias = allTutorias.filter(t => t.estudianteId === user.id);
      } else if (user.rol === 'docente') {
        allTutorias = allTutorias.filter(t => t.docenteId === user.id);
      }
      // Admin sees all
    }
    
    return allTutorias;
  }, [filterByUser, filterByRole, user]);

  // Get tutorias for selected date
  const tutoriasForSelectedDate = useMemo(() => {
    return tutorias.filter(t => {
      const tutoriaDate = parseISO(t.fecha);
      return isSameDay(tutoriaDate, selectedDate);
    });
  }, [tutorias, selectedDate]);

  // Get dates with tutorias for highlighting
  const datesWithTutorias = useMemo(() => {
    const dates: { [key: string]: TutoriaStatus[] } = {};
    tutorias.forEach(t => {
      const dateKey = t.fecha;
      if (!dates[dateKey]) {
        dates[dateKey] = [];
      }
      dates[dateKey].push(t.estado);
    });
    return dates;
  }, [tutorias]);

  const getStatusColor = (estado: TutoriaStatus) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-accent text-accent-foreground';
      case 'aceptada':
        return 'bg-success text-success-foreground';
      case 'rechazada':
        return 'bg-destructive text-destructive-foreground';
      case 'finalizada':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (estado: TutoriaStatus) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'aceptada': return 'Aceptada';
      case 'rechazada': return 'Rechazada';
      case 'finalizada': return 'Finalizada';
    }
  };

  const handleTutoriaClick = (tutoria: Tutoria) => {
    setSelectedTutoria(tutoria);
    setIsDetailOpen(true);
  };

  const handleReschedule = () => {
    if (!selectedTutoria) return;
    setRescheduleData({
      fecha: selectedTutoria.fecha,
      hora: selectedTutoria.hora,
    });
    setIsDetailOpen(false);
    setIsRescheduleOpen(true);
  };

  const submitReschedule = () => {
    if (!selectedTutoria || !rescheduleData.fecha || !rescheduleData.hora) return;

    const result = updateTutoria(selectedTutoria.id, {
      fecha: rescheduleData.fecha,
      hora: rescheduleData.hora,
    });

    if (result) {
      // Notify both student and teacher
      const mensaje = `Tutoría "${selectedTutoria.tema}" reprogramada para ${format(parseISO(rescheduleData.fecha), 'dd/MM/yyyy')} a las ${rescheduleData.hora}`;
      createNotification({
        userId: selectedTutoria.estudianteId,
        mensaje,
        tipo: 'reprogramada',
        tutoriaId: selectedTutoria.id,
      });
      createNotification({
        userId: selectedTutoria.docenteId,
        mensaje,
        tipo: 'reprogramada',
        tutoriaId: selectedTutoria.id,
      });

      toast({
        title: 'Tutoría reprogramada',
        description: 'La fecha y hora han sido actualizadas.',
      });
      setIsRescheduleOpen(false);
      setSelectedTutoria(null);
    }
  };

  const canReschedule = hasRole(['admin', 'docente']) && 
    selectedTutoria?.estado !== 'finalizada' && 
    selectedTutoria?.estado !== 'rechazada';

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Calendario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={es}
              className="rounded-md border pointer-events-auto"
              modifiers={{
                hasTutorias: (date) => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  return !!datesWithTutorias[dateKey];
                },
              }}
              modifiersStyles={{
                hasTutorias: {
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                },
              }}
              components={{
                DayContent: ({ date }) => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const statuses = datesWithTutorias[dateKey];
                  
                  return (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {date.getDate()}
                      {statuses && statuses.length > 0 && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {statuses.slice(0, 3).map((status, i) => (
                            <div
                              key={i}
                              className={cn(
                                "h-1 w-1 rounded-full",
                                status === 'pendiente' && "bg-accent",
                                status === 'aceptada' && "bg-success",
                                status === 'rechazada' && "bg-destructive",
                                status === 'finalizada' && "bg-primary"
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                },
              }}
            />
            
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-accent" />
                <span>Pendiente</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span>Aceptada</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-destructive" />
                <span>Rechazada</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span>Finalizada</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tutorias for selected date */}
        <Card>
          <CardHeader>
            <CardTitle>
              Tutorías del {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tutoriasForSelectedDate.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No hay tutorías para esta fecha</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tutoriasForSelectedDate.map((tutoria) => {
                  const estudiante = getUserById(tutoria.estudianteId);
                  const docente = getUserById(tutoria.docenteId);
                  
                  return (
                    <div
                      key={tutoria.id}
                      className="rounded-lg border border-border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleTutoriaClick(tutoria)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(tutoria.estado)}>
                              {getStatusLabel(tutoria.estado)}
                            </Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {tutoria.hora}
                            </span>
                          </div>
                          <h4 className="font-medium text-foreground truncate">{tutoria.tema}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Docente: {docente ? `${docente.nombres} ${docente.apellidos}` : 'N/A'}
                            </span>
                            <span className="flex items-center gap-1 mt-0.5">
                              <BookOpen className="h-3 w-3" />
                              Estudiante: {estudiante ? `${estudiante.nombres} ${estudiante.apellidos}` : 'N/A'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tutoria Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles de la Tutoría</DialogTitle>
          </DialogHeader>
          {selectedTutoria && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(selectedTutoria.estado)}>
                  {getStatusLabel(selectedTutoria.estado)}
                </Badge>
              </div>
              
              <div className="grid gap-3">
                <div>
                  <Label className="text-muted-foreground">Tema</Label>
                  <p className="font-medium">{selectedTutoria.tema}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Descripción</Label>
                  <p>{selectedTutoria.descripcion || 'Sin descripción'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-muted-foreground">Fecha</Label>
                    <p>{format(parseISO(selectedTutoria.fecha), 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Hora</Label>
                    <p>{selectedTutoria.hora}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Docente</Label>
                  <p>{(() => {
                    const docente = getUserById(selectedTutoria.docenteId);
                    return docente ? `${docente.nombres} ${docente.apellidos}` : 'N/A';
                  })()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estudiante</Label>
                  <p>{(() => {
                    const estudiante = getUserById(selectedTutoria.estudianteId);
                    return estudiante ? `${estudiante.nombres} ${estudiante.apellidos}` : 'N/A';
                  })()}</p>
                </div>
                {selectedTutoria.calificacion && (
                  <div>
                    <Label className="text-muted-foreground">Calificación</Label>
                    <p>{selectedTutoria.calificacion} / 5 ⭐</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            {canReschedule && (
              <Button onClick={handleReschedule}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Reprogramar
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprogramar Tutoría</DialogTitle>
            <DialogDescription>
              Selecciona la nueva fecha y hora para la tutoría
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Nueva Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={rescheduleData.fecha}
                onChange={(e) => setRescheduleData({ ...rescheduleData, fecha: e.target.value })}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Nueva Hora</Label>
              <Input
                id="hora"
                type="time"
                value={rescheduleData.hora}
                onChange={(e) => setRescheduleData({ ...rescheduleData, hora: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRescheduleOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitReschedule}>
              Confirmar Reprogramación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutoriasCalendar;
