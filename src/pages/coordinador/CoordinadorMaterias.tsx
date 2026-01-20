import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getMaterias, getCarreras, createMateria, getUsers, getMateriaByCodigo, getSemestres, getCarreraById } from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import type { Materia } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, BookOpen, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CoordinadorMaterias: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  if (!user) {
    return null;
  }

  const [materias, setMaterias] = useState<Materia[]>(getMaterias());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    semestreId: '',
    descripcion: '',
    creditos: 0,
  });

  // Obtener la carrera del coordinador (automática)
  const coordinadorCarrera = useMemo(() => {
    if (!user || !user.carrera) return null;
    const carreras = getCarreras();
    // Buscar por nombre del campo carrera del usuario
    return carreras.find(c => c.nombre === user.carrera || c.id === user.carrera);
  }, [user]);

  const semestres = useMemo(() => getSemestres().filter(s => s.activo), []);

  const materiasCarrera = useMemo(() => {
    if (!coordinadorCarrera) return [];
    return materias.filter(m => m.carreraId === coordinadorCarrera.id);
  }, [materias, coordinadorCarrera]);

  const openCreateDialog = () => {
    setFormData({ nombre: '', codigo: '', semestreId: '', descripcion: '', creditos: 0 });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.codigo || !formData.semestreId) {
      toast({ title: 'Error', description: 'El nombre, código y semestre son obligatorios', variant: 'destructive' });
      return;
    }

    if (!coordinadorCarrera) {
      toast({ title: 'Error', description: 'No se pudo determinar tu carrera. Contacta al administrador.', variant: 'destructive' });
      return;
    }

    // Validar código único
    const codigoExistente = getMateriaByCodigo(formData.codigo);
    if (codigoExistente) {
      toast({ title: 'Error', description: 'El código de materia ya existe. Por favor usa otro código.', variant: 'destructive' });
      return;
    }

    const result = createMateria({
      nombre: formData.nombre,
      codigo: formData.codigo.toUpperCase(),
      carreraId: coordinadorCarrera.id, // Se asigna automáticamente según la carrera del coordinador
      semestreId: formData.semestreId,
      descripcion: formData.descripcion || undefined,
      creditos: formData.creditos || undefined,
      estado: 'pendiente', // Pendiente de aprobación del administrador
      coordinadorId: user?.id,
      activa: false, // No activa hasta que sea aprobada
    });

    if (result) {
      toast({ title: 'Materia creada', description: 'La materia ha sido creada y está pendiente de aprobación del administrador.' });
      setMaterias(getMaterias());
      setIsDialogOpen(false);
      setFormData({ nombre: '', codigo: '', semestreId: '', descripcion: '', creditos: 0 });
    } else {
      toast({ title: 'Error', description: 'No se pudo crear la materia. Intenta nuevamente.', variant: 'destructive' });
    }
  };

  const getCarreraNombre = (carreraId: string) => {
    const carrera = getCarreraById(carreraId);
    return carrera?.nombre || 'Desconocida';
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'aprobada':
        return <Badge className="bg-green-100 text-green-800">Aprobada</Badge>;
      case 'rechazada':
        return <Badge className="bg-red-100 text-red-800">Rechazada</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Materias</h1>
            <p className="text-muted-foreground">Crea nuevas materias para tu carrera (requieren aprobación del administrador)</p>
          </div>
          <Button onClick={openCreateDialog}><Plus className="mr-2 h-4 w-4" />Nueva Materia</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Materias de mi Carrera ({materiasCarrera.length})</CardTitle></CardHeader>
          <CardContent>
            {materiasCarrera.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay materias registradas para tu carrera.</p>
            ) : (
              <div className="space-y-4">
                {materiasCarrera.map((materia) => (
                  <div
                    key={materia.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{materia.nombre}</h3>
                        <p className="text-sm text-muted-foreground">Código: {materia.codigo}</p>
                        {materia.descripcion && (
                          <p className="text-sm text-muted-foreground mt-1">{materia.descripcion}</p>
                        )}
                        {materia.creditos && (
                          <p className="text-xs text-muted-foreground mt-1">Créditos: {materia.creditos}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getEstadoBadge(materia.estado)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Materia</DialogTitle>
              <DialogDescription>La materia quedará pendiente de aprobación del administrador.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                {/* Carrera - No editable, automática */}
                <div className="space-y-2">
                  <Label>Carrera</Label>
                  <Input 
                    value={coordinadorCarrera?.nombre || 'No asignada'} 
                    disabled 
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    La carrera se asigna automáticamente según tu perfil de coordinador
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Nombre de la Materia <span className="text-destructive">*</span></Label>
                  <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Código <span className="text-destructive">*</span></Label>
                  <Input 
                    value={formData.codigo} 
                    onChange={(e) => setFormData({...formData, codigo: e.target.value.toUpperCase()})} 
                    required 
                    placeholder="Ej: MAT101" 
                  />
                  <p className="text-xs text-muted-foreground">
                    El código debe ser único en el sistema
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Semestre <span className="text-destructive">*</span></Label>
                  <Select value={formData.semestreId} onValueChange={(value) => setFormData({...formData, semestreId: value})} required>
                    <SelectTrigger><SelectValue placeholder="Seleccionar semestre" /></SelectTrigger>
                    <SelectContent>
                      {semestres.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Créditos (opcional)</Label>
                  <Input type="number" min="0" value={formData.creditos} onChange={(e) => setFormData({...formData, creditos: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Crear Materia</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CoordinadorMaterias;

