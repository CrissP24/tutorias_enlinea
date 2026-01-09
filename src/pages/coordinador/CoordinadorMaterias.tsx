import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getMaterias, getCarreras, createMateria, getUsers } from '@/lib/storage';
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
    carreraId: '',
    descripcion: '',
    creditos: 0,
  });

  const carreras = useMemo(() => {
    // El coordinador solo puede crear materias para su carrera
    const userCarrera = getUsers().find(u => u.id === user?.id)?.carrera;
    return getCarreras().filter(c => c.nombre === userCarrera && c.activa);
  }, [user]);

  const materiasCarrera = useMemo(() => {
    const userCarrera = getUsers().find(u => u.id === user?.id)?.carrera;
    const carrera = carreras.find(c => c.nombre === userCarrera);
    if (!carrera) return [];
    return materias.filter(m => m.carreraId === carrera.id);
  }, [materias, carreras, user]);

  const openCreateDialog = () => {
    const userCarrera = getUsers().find(u => u.id === user?.id)?.carrera;
    const carrera = carreras.find(c => c.nombre === userCarrera);
    setFormData({ nombre: '', codigo: '', carreraId: carrera?.id || '', descripcion: '', creditos: 0 });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.codigo || !formData.carreraId) {
      toast({ title: 'Error', description: 'El nombre, código y carrera son obligatorios', variant: 'destructive' });
      return;
    }

    const result = createMateria({
      nombre: formData.nombre,
      codigo: formData.codigo,
      carreraId: formData.carreraId,
      descripcion: formData.descripcion,
      creditos: formData.creditos || undefined,
      estado: 'pendiente', // Pendiente de aprobación del administrador
      coordinadorId: user?.id,
      activa: false, // No activa hasta que sea aprobada
    });

    if (result) {
      toast({ title: 'Materia creada', description: 'La materia ha sido creada y está pendiente de aprobación del administrador.' });
      setMaterias(getMaterias());
      setIsDialogOpen(false);
    }
  };

  const getCarreraNombre = (carreraId: string) => {
    const carrera = carreras.find(c => c.id === carreraId);
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Materia</DialogTitle>
              <DialogDescription>La materia quedará pendiente de aprobación del administrador.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre de la Materia</Label>
                  <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input value={formData.codigo} onChange={(e) => setFormData({...formData, codigo: e.target.value.toUpperCase()})} required placeholder="Ej: MAT101" />
                </div>
                <div className="space-y-2">
                  <Label>Carrera</Label>
                  <Select value={formData.carreraId} onValueChange={(value) => setFormData({...formData, carreraId: value})} required>
                    <SelectTrigger><SelectValue placeholder="Seleccionar carrera" /></SelectTrigger>
                    <SelectContent>
                      {carreras.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
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

