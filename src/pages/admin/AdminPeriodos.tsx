import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getPeriodos, createPeriodo, updatePeriodo, deletePeriodo } from '@/lib/storage';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminPeriodos = () => {
  const [periodos, setPeriodos] = useState(getPeriodos());
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
    activo: false,
    anio: new Date().getFullYear(),
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre || !formData.fechaInicio || !formData.fechaFin) {
      toast.error('Completa todos los campos');
      return;
    }

    if (editingId) {
      const updated = updatePeriodo(editingId, formData);
      if (updated) {
        toast.success('Período actualizado');
        setPeriodos(getPeriodos());
      } else {
        toast.error('Error al actualizar período');
      }
    } else {
      createPeriodo(formData as any);
      toast.success('Período creado');
      setPeriodos(getPeriodos());
    }

    setFormData({
      nombre: '',
      fechaInicio: '',
      fechaFin: '',
      activo: false,
      anio: new Date().getFullYear(),
    });
    setEditingId(null);
    setOpenDialog(false);
  };

  const handleEdit = (periodo: any) => {
    setEditingId(periodo.id);
    setFormData({
      nombre: periodo.nombre,
      fechaInicio: periodo.fechaInicio,
      fechaFin: periodo.fechaFin,
      activo: periodo.activo,
      anio: periodo.anio,
    });
    setOpenDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este período?')) {
      if (deletePeriodo(id)) {
        toast.success('Período eliminado');
        setPeriodos(getPeriodos());
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Períodos</h1>
            <p className="text-gray-600 mt-2">Define los períodos académicos del año</p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingId(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Período
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Editar Período' : 'Crear Nuevo Período'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre del Período</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: Primer Período 2025"
                  />
                </div>
                <div>
                  <Label htmlFor="anio">Año</Label>
                  <Input
                    id="anio"
                    name="anio"
                    type="number"
                    value={formData.anio}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                    <Input
                      id="fechaInicio"
                      name="fechaInicio"
                      type="date"
                      value={formData.fechaInicio}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fechaFin">Fecha Fin</Label>
                    <Input
                      id="fechaFin"
                      name="fechaFin"
                      type="date"
                      value={formData.fechaFin}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activo"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleInputChange}
                    className="rounded"
                  />
                  <Label htmlFor="activo" className="cursor-pointer">
                    Establecer como período activo
                  </Label>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">
                    {editingId ? 'Actualizar' : 'Crear'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenDialog(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Periodos Table */}
        <Card>
          <CardContent className="pt-6">
            {periodos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay períodos creados. Crea uno para empezar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Año</TableHead>
                      <TableHead>Fecha Inicio</TableHead>
                      <TableHead>Fecha Fin</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periodos.map(periodo => (
                      <TableRow key={periodo.id}>
                        <TableCell className="font-medium">{periodo.nombre}</TableCell>
                        <TableCell>{periodo.anio}</TableCell>
                        <TableCell>{periodo.fechaInicio}</TableCell>
                        <TableCell>{periodo.fechaFin}</TableCell>
                        <TableCell>
                          {periodo.activo ? (
                            <Badge className="bg-green-100 text-green-800">Activo</Badge>
                          ) : (
                            <Badge variant="outline">Inactivo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(periodo)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleDelete(periodo.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminPeriodos;
