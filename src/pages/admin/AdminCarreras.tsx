import React, { useState, useMemo } from 'react';
import { getCarreras, createCarrera, updateCarrera, deleteCarrera } from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Plus, Search, Edit, Trash2, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Carrera } from '@/types';

const AdminCarreras: React.FC = () => {
  const { toast } = useToast();
  const [carreras, setCarreras] = useState<Carrera[]>(getCarreras());
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCarrera, setSelectedCarrera] = useState<Carrera | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    activa: true,
  });

  const filteredCarreras = useMemo(() => {
    return carreras.filter(carrera => {
      const search = searchTerm.toLowerCase();
      return (
        carrera.nombre.toLowerCase().includes(search) ||
        carrera.codigo.toLowerCase().includes(search) ||
        carrera.descripcion?.toLowerCase().includes(search)
      );
    });
  }, [carreras, searchTerm]);

  const refreshCarreras = () => setCarreras(getCarreras());

  const openCreateDialog = () => {
    setSelectedCarrera(null);
    setFormData({ nombre: '', codigo: '', descripcion: '', activa: true });
    setIsDialogOpen(true);
  };

  const openEditDialog = (carrera: Carrera) => {
    setSelectedCarrera(carrera);
    setFormData({
      nombre: carrera.nombre,
      codigo: carrera.codigo,
      descripcion: carrera.descripcion || '',
      activa: carrera.activa,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (carrera: Carrera) => {
    setSelectedCarrera(carrera);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.codigo) {
      toast({ title: 'Error', description: 'El nombre y código son obligatorios', variant: 'destructive' });
      return;
    }

    if (selectedCarrera) {
      const result = updateCarrera(selectedCarrera.id, formData);
      
      if (result) {
        toast({ title: 'Carrera actualizada', description: 'Los datos de la carrera han sido actualizados.' });
        refreshCarreras();
        setIsDialogOpen(false);
      } else {
        toast({ title: 'Error', description: 'El código ya está en uso.', variant: 'destructive' });
      }
    } else {
      const result = createCarrera(formData);

      if (result) {
        toast({ title: 'Carrera creada', description: 'La carrera ha sido creada exitosamente.' });
        refreshCarreras();
        setIsDialogOpen(false);
      } else {
        toast({ title: 'Error', description: 'El código ya está registrado.', variant: 'destructive' });
      }
    }
  };

  const handleDelete = () => {
    if (!selectedCarrera) return;
    const result = deleteCarrera(selectedCarrera.id);
    if (result) {
      toast({ title: 'Carrera eliminada', description: 'La carrera ha sido eliminada del sistema.' });
      refreshCarreras();
    }
    setIsDeleteDialogOpen(false);
    setSelectedCarrera(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Carreras</h1>
            <p className="text-muted-foreground">Administra las carreras del sistema</p>
          </div>
          <Button onClick={openCreateDialog}><Plus className="mr-2 h-4 w-4" />Nueva Carrera</Button>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o código..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Carreras ({filteredCarreras.length})</CardTitle></CardHeader>
          <CardContent>
            {filteredCarreras.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay carreras registradas.</p>
            ) : (
              <div className="space-y-4">
                {filteredCarreras.map((carrera) => (
                  <div
                    key={carrera.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <GraduationCap className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{carrera.nombre}</h3>
                        <p className="text-sm text-muted-foreground">Código: {carrera.codigo}</p>
                        {carrera.descripcion && (
                          <p className="text-sm text-muted-foreground mt-1">{carrera.descripcion}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${carrera.activa ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                        {carrera.activa ? 'Activa' : 'Inactiva'}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(carrera)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteDialog(carrera)}><Trash2 className="h-4 w-4" /></Button>
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
              <DialogTitle>{selectedCarrera ? 'Editar Carrera' : 'Nueva Carrera'}</DialogTitle>
              <DialogDescription>{selectedCarrera ? 'Modifica los datos de la carrera.' : 'Crea una nueva carrera en el sistema.'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre de la Carrera</Label>
                  <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input value={formData.codigo} onChange={(e) => setFormData({...formData, codigo: e.target.value.toUpperCase()})} required placeholder="Ej: IS" />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} rows={3} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="activa">Carrera Activa</Label>
                  <Switch id="activa" checked={formData.activa} onCheckedChange={(checked) => setFormData({...formData, activa: checked})} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">{selectedCarrera ? 'Guardar' : 'Crear'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar carrera?</AlertDialogTitle>
              <AlertDialogDescription>Se eliminará <strong>{selectedCarrera?.nombre}</strong> del sistema.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminCarreras;


