import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUsers,
  getCarreras,
  getMaterias,
  getSemestres,
  getCarreraById,
  getDocenteMateriaSemestres,
  createDocenteMateriaSemestre,
  updateDocenteMateriaSemestre,
  deleteDocenteMateriaSemestre,
  getMateriaById,
  getSemestreById,
  userHasRole,
} from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Plus, UserCheck, BookOpen, GraduationCap, Edit, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { DocenteMateriaSemestre } from '@/types';

const CoordinadorAsignaciones: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user) {
    return null;
  }

  // Obtener la carrera del coordinador
  const coordinadorCarrera = useMemo(() => {
    if (!user.carrera) return null;
    const carreras = getCarreras();
    return carreras.find(c => c.id === user.carrera || c.nombre === user.carrera);
  }, [user]);

  // Obtener docentes de la carrera del coordinador
  const docentes = useMemo(() => {
    if (!coordinadorCarrera) return [];
    return getUsers().filter(
      u => userHasRole(u, 'docente') && 
           u.estado === 'activo' && 
           u.carrera === coordinadorCarrera.nombre
    );
  }, [coordinadorCarrera]);

  // Obtener materias aprobadas de la carrera
  const materias = useMemo(() => {
    if (!coordinadorCarrera) return [];
    return getMaterias().filter(
      m => m.carreraId === coordinadorCarrera.id && 
           m.estado === 'aprobada' && 
           m.activa
    );
  }, [coordinadorCarrera]);

  // Obtener semestres activos
  const semestres = useMemo(() => getSemestres().filter(s => s.activo), []);

  // Obtener todas las asignaciones de la carrera
  const [asignaciones, setAsignaciones] = useState<DocenteMateriaSemestre[]>(() => {
    if (!coordinadorCarrera) return [];
    return getDocenteMateriaSemestres().filter(
      a => a.carreraId === coordinadorCarrera.id
    );
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAsignacion, setSelectedAsignacion] = useState<DocenteMateriaSemestre | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDocente, setFilterDocente] = useState<string>('all');
  const [filterSemestre, setFilterSemestre] = useState<string>('all');
  const [filterMateria, setFilterMateria] = useState<string>('all');

  const [formData, setFormData] = useState({
    docenteId: '',
    materiaId: '',
    semestreId: '',
  });

  // Filtrar asignaciones
  const filteredAsignaciones = useMemo(() => {
    return asignaciones.filter(a => {
      const matchesDocente = filterDocente === 'all' || a.docenteId === filterDocente;
      const matchesSemestre = filterSemestre === 'all' || a.semestreId === filterSemestre;
      const matchesMateria = filterMateria === 'all' || a.materiaId === filterMateria;
      
      if (searchTerm) {
        const docente = docentes.find(d => d.id === a.docenteId);
        const materia = materias.find(m => m.id === a.materiaId);
        const semestre = semestres.find(s => s.id === a.semestreId);
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          (docente?.nombres || '').toLowerCase().includes(searchLower) ||
          (docente?.apellidos || '').toLowerCase().includes(searchLower) ||
          (materia?.nombre || '').toLowerCase().includes(searchLower) ||
          (materia?.codigo || '').toLowerCase().includes(searchLower) ||
          (semestre?.nombre || '').toLowerCase().includes(searchLower);
        
        return matchesDocente && matchesSemestre && matchesMateria && matchesSearch;
      }
      
      return matchesDocente && matchesSemestre && matchesMateria;
    });
  }, [asignaciones, filterDocente, filterSemestre, filterMateria, searchTerm, docentes, materias, semestres]);

  const refreshAsignaciones = () => {
    if (!coordinadorCarrera) return;
    const nuevasAsignaciones = getDocenteMateriaSemestres().filter(
      a => a.carreraId === coordinadorCarrera.id
    );
    setAsignaciones(nuevasAsignaciones);
  };

  const openCreateDialog = () => {
    setSelectedAsignacion(null);
    setFormData({ docenteId: '', materiaId: '', semestreId: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (asignacion: DocenteMateriaSemestre) => {
    setSelectedAsignacion(asignacion);
    setFormData({
      docenteId: asignacion.docenteId,
      materiaId: asignacion.materiaId,
      semestreId: asignacion.semestreId,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (asignacion: DocenteMateriaSemestre) => {
    setSelectedAsignacion(asignacion);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.docenteId || !formData.materiaId || !formData.semestreId) {
      toast({
        title: 'Error',
        description: 'Todos los campos son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    if (!coordinadorCarrera) {
      toast({
        title: 'Error',
        description: 'No se pudo determinar tu carrera. Contacta al administrador.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedAsignacion) {
      // Editar asignación existente
      const result = updateDocenteMateriaSemestre(selectedAsignacion.id, {
        docenteId: formData.docenteId,
        materiaId: formData.materiaId,
        semestreId: formData.semestreId,
        carreraId: coordinadorCarrera.id,
        activo: true,
      });

      if (result) {
        toast({
          title: 'Asignación actualizada',
          description: 'La asignación ha sido actualizada correctamente.',
        });
        refreshAsignaciones();
        setIsDialogOpen(false);
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo actualizar la asignación.',
          variant: 'destructive',
        });
      }
    } else {
      // Crear nueva asignación
      const result = createDocenteMateriaSemestre({
        docenteId: formData.docenteId,
        materiaId: formData.materiaId,
        semestreId: formData.semestreId,
        carreraId: coordinadorCarrera.id,
        activo: true,
      });

      if (result) {
        toast({
          title: 'Asignación creada',
          description: 'El docente ha sido asignado a la materia y semestre correctamente.',
        });
        refreshAsignaciones();
        setIsDialogOpen(false);
        setFormData({ docenteId: '', materiaId: '', semestreId: '' });
      } else {
        toast({
          title: 'Error',
          description: 'Esta asignación ya existe o hubo un error al crearla.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDelete = () => {
    if (!selectedAsignacion) return;

    const result = deleteDocenteMateriaSemestre(selectedAsignacion.id);
    if (result) {
      toast({
        title: 'Asignación eliminada',
        description: 'La asignación ha sido eliminada correctamente.',
      });
      refreshAsignaciones();
    }
    setIsDeleteDialogOpen(false);
    setSelectedAsignacion(null);
  };

  const getDocenteNombre = (docenteId: string) => {
    const docente = docentes.find(d => d.id === docenteId);
    return docente ? `${docente.nombres} ${docente.apellidos}` : 'Desconocido';
  };

  const getMateriaNombre = (materiaId: string) => {
    const materia = materias.find(m => m.id === materiaId);
    return materia ? `${materia.nombre} (${materia.codigo})` : 'Desconocida';
  };

  const getSemestreNombre = (semestreId: string) => {
    const semestre = semestres.find(s => s.id === semestreId);
    return semestre?.nombre || 'Desconocido';
  };

  if (!coordinadorCarrera) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              No se pudo determinar tu carrera. Contacta al administrador.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Asignación de Docentes a Materias</h1>
            <p className="text-muted-foreground">
              Gestiona qué materias imparte cada docente y en qué semestres
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Asignación
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por docente, materia o semestre..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterDocente} onValueChange={setFilterDocente}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Docente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los docentes</SelectItem>
                {docentes.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nombres} {d.apellidos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSemestre} onValueChange={setFilterSemestre}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Semestre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los semestres</SelectItem>
                {semestres.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterMateria} onValueChange={setFilterMateria}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Materia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las materias</SelectItem>
                {materias.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nombre} ({m.codigo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Lista de asignaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Asignaciones ({filteredAsignaciones.length})</CardTitle>
            <CardDescription>
              Docentes asignados a materias por semestre en {coordinadorCarrera.nombre}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAsignaciones.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay asignaciones registradas. Crea una nueva asignación para comenzar.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredAsignaciones.map((asignacion) => (
                  <div
                    key={asignacion.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <UserCheck className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">
                            {getDocenteNombre(asignacion.docenteId)}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {getSemestreNombre(asignacion.semestreId)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BookOpen className="h-4 w-4" />
                          <span>{getMateriaNombre(asignacion.materiaId)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {asignacion.activo ? (
                        <Badge className="bg-green-100 text-green-800">Activa</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Inactiva</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(asignacion)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => openDeleteDialog(asignacion)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog para crear/editar asignación */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedAsignacion ? 'Editar Asignación' : 'Nueva Asignación'}
              </DialogTitle>
              <DialogDescription>
                {selectedAsignacion
                  ? 'Modifica la asignación del docente a materia y semestre.'
                  : 'Asigna un docente a una materia específica para un semestre determinado.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Docente <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.docenteId}
                    onValueChange={(value) => setFormData({ ...formData, docenteId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar docente" />
                    </SelectTrigger>
                    <SelectContent>
                      {docentes.length === 0 ? (
                        <SelectItem value="no-docentes" disabled>
                          No hay docentes disponibles
                        </SelectItem>
                      ) : (
                        docentes.map(d => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.nombres} {d.apellidos}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Materia <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.materiaId}
                    onValueChange={(value) => setFormData({ ...formData, materiaId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar materia" />
                    </SelectTrigger>
                    <SelectContent>
                      {materias.length === 0 ? (
                        <SelectItem value="no-materias" disabled>
                          No hay materias aprobadas disponibles
                        </SelectItem>
                      ) : (
                        materias.map(m => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.nombre} ({m.codigo})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Semestre <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.semestreId}
                    onValueChange={(value) => setFormData({ ...formData, semestreId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar semestre" />
                    </SelectTrigger>
                    <SelectContent>
                      {semestres.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{selectedAsignacion ? 'Guardar' : 'Crear'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmación de eliminación */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar asignación?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará la asignación de{' '}
                <strong>{selectedAsignacion && getDocenteNombre(selectedAsignacion.docenteId)}</strong>{' '}
                a la materia{' '}
                <strong>
                  {selectedAsignacion && getMateriaNombre(selectedAsignacion.materiaId)}
                </strong>{' '}
                en el semestre{' '}
                <strong>
                  {selectedAsignacion && getSemestreNombre(selectedAsignacion.semestreId)}
                </strong>
                . Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default CoordinadorAsignaciones;

