import React, { useState, useMemo, useEffect } from 'react';
import { getUsers, getTutorias, deleteTutoria } from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StatusBadge } from '@/components/ui/status-badge';
import { StarRating } from '@/components/ui/star-rating';
import { Search, Trash2, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tutoria, TutoriaStatus } from '@/types';

const AdminTutorias: React.FC = () => {
  const { toast } = useToast();
  const [tutorias, setTutorias] = useState<Tutoria[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<TutoriaStatus | 'all'>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTutoria, setSelectedTutoria] = useState<Tutoria | null>(null);

  const users = useMemo(() => getUsers(), []);

  // Cargar tutorías al montar el componente y refrescar periódicamente
  useEffect(() => {
    const loadTutorias = () => {
      try {
        const allTutorias = getTutorias();
        setTutorias(allTutorias);
      } catch (error) {
        console.error('Error al cargar tutorías:', error);
        setTutorias([]);
      }
    };

    loadTutorias();
    
    // Refrescar cada 5 segundos para mantener los datos actualizados
    const interval = setInterval(loadTutorias, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getUserName = (id: string) => {
    const user = users.find(u => u.id === id);
    return user ? `${user.nombres} ${user.apellidos}` : 'Desconocido';
  };

  const filteredTutorias = useMemo(() => {
    if (!tutorias || tutorias.length === 0) {
      return [];
    }

    return tutorias.filter(tutoria => {
      // Normalizar estado: 'Solicitada' -> 'pendiente'
      const estadoNormalizado = tutoria.estado === 'Solicitada' ? 'pendiente' : tutoria.estado;
      
      const estudiante = getUserName(tutoria.estudianteId).toLowerCase();
      const docente = getUserName(tutoria.docenteId).toLowerCase();
      const tema = (tutoria.tema || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      
      const matchesSearch = 
        estudiante.includes(search) ||
        docente.includes(search) ||
        tema.includes(search);
      
      // Comparar con estado normalizado
      const matchesStatus = filterStatus === 'all' || 
                           tutoria.estado === filterStatus || 
                           (filterStatus === 'pendiente' && tutoria.estado === 'Solicitada');
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return dateB - dateA;
    });
  }, [tutorias, searchTerm, filterStatus, users]);

  const refreshTutorias = () => {
    setTutorias(getTutorias());
  };

  const openDeleteDialog = (tutoria: Tutoria) => {
    setSelectedTutoria(tutoria);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!selectedTutoria) return;

    const result = deleteTutoria(selectedTutoria.id);
    
    if (result) {
      toast({
        title: 'Tutoría eliminada',
        description: 'La tutoría ha sido eliminada del sistema.',
      });
      refreshTutorias();
    } else {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la tutoría.',
        variant: 'destructive',
      });
    }

    setIsDeleteDialogOpen(false);
    setSelectedTutoria(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Tutorías</h1>
          <p className="text-muted-foreground">
            Visualiza y administra todas las tutorías del sistema
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por tema, estudiante o docente..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as TutoriaStatus | 'all')}>
              <SelectTrigger className="w-full sm:w-48">
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
          </CardContent>
        </Card>

        {/* Tutorias List */}
        <Card>
          <CardHeader>
            <CardTitle>Todas las Tutorías</CardTitle>
            <CardDescription>
              {filteredTutorias.length} tutoría(s) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTutorias.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No se encontraron tutorías.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredTutorias.map((tutoria) => (
                  <div
                    key={tutoria.id}
                    className="rounded-xl border border-border p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-foreground">{tutoria.tema || 'Sin tema'}</h3>
                          <StatusBadge 
                            status={tutoria.estado === 'Solicitada' ? 'pendiente' : tutoria.estado} 
                            size="sm" 
                          />
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {tutoria.descripcion}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            <strong>Estudiante:</strong> {getUserName(tutoria.estudianteId)}
                          </span>
                          <span>
                            <strong>Docente:</strong> {getUserName(tutoria.docenteId)}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(tutoria.fecha).toLocaleDateString('es-ES')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {tutoria.hora}
                          </span>
                        </div>

                        {tutoria.calificacion && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Calificación:</span>
                            <StarRating value={tutoria.calificacion} readonly size="sm" />
                            {tutoria.comentario && (
                              <span className="text-sm text-muted-foreground italic">
                                "{tutoria.comentario}"
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(tutoria)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar tutoría?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará la tutoría{' '}
                <strong>{selectedTutoria?.tema}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminTutorias;
