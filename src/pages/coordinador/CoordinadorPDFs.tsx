import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPDFs, createPDF, updatePDF, deletePDF, getCarreras, createNotificationByCarrera } from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Search, Edit, Trash2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PDF } from '@/types';

const CoordinadorPDFs: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfs, setPDFs] = useState<PDF[]>(getPDFs());
  const [carreras] = useState(getCarreras());
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState<PDF | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    archivo: null as File | null,
  });

  if (!user) {
    return null;
  }

  // Coordinador solo puede gestionar PDFs de su carrera asignada
  const userCarrera = user.carrera || '';
  const carreraObj = carreras.find(c => c.id === userCarrera || c.nombre.toLowerCase() === userCarrera.toLowerCase());
  const carreraId = carreraObj?.id || userCarrera;

  // Filtrar PDFs solo de la carrera del coordinador
  const myPDFs = useMemo(() => {
    return pdfs.filter(pdf => pdf.carrera === carreraId || pdf.carrera.toLowerCase() === userCarrera.toLowerCase());
  }, [pdfs, carreraId, userCarrera]);

  const filteredPDFs = useMemo(() => {
    return myPDFs.filter(pdf => {
      return pdf.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [myPDFs, searchTerm]);

  const handleOpenDialog = (pdf?: PDF) => {
    // Verificar permisos - coordinador solo puede editar sus propios PDFs de su carrera
    if (pdf && (pdf.carrera !== carreraId && pdf.carrera.toLowerCase() !== userCarrera.toLowerCase())) {
      toast({
        title: 'Error',
        description: 'No tienes permisos para editar PDFs de otras carreras.',
        variant: 'destructive',
      });
      return;
    }

    if (pdf) {
      setSelectedPDF(pdf);
      setFormData({
        nombre: pdf.nombre,
        descripcion: pdf.descripcion || '',
        archivo: null,
      });
    } else {
      setSelectedPDF(null);
      setFormData({
        nombre: '',
        descripcion: '',
        archivo: null,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedPDF(null);
    setFormData({
      nombre: '',
      descripcion: '',
      archivo: null,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Error',
          description: 'Por favor selecciona un archivo PDF.',
          variant: 'destructive',
        });
        return;
      }
      setFormData({ ...formData, archivo: file, nombre: formData.nombre || file.name });
    }
  };

  const handleSubmit = () => {
    if (!formData.nombre.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre es requerido.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedPDF && !formData.archivo) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un archivo PDF.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedPDF) {
      // Verificar permisos antes de editar
      if (selectedPDF.carrera !== carreraId && selectedPDF.carrera.toLowerCase() !== userCarrera.toLowerCase()) {
        toast({
          title: 'Error',
          description: 'No tienes permisos para editar PDFs de otras carreras.',
          variant: 'destructive',
        });
        return;
      }

      // Editar PDF existente
      const updated = updatePDF(selectedPDF.id, {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
      });

      if (updated) {
        setPDFs(getPDFs());
        toast({
          title: 'Éxito',
          description: 'PDF actualizado correctamente.',
        });
        handleCloseDialog();
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo actualizar el PDF.',
          variant: 'destructive',
        });
      }
    } else {
      // Crear nuevo PDF - siempre para la carrera del coordinador
      const file = formData.archivo!;
      
      const newPDF = createPDF({
        nombre: formData.nombre.trim(),
        carrera: carreraId,
        rolSubida: 'coordinador',
        usuarioSubida: user.id,
        nombreArchivo: file.name,
        tamaño: file.size,
        descripcion: formData.descripcion.trim() || undefined,
        activo: true,
      });

      // Crear notificación para estudiantes de la carrera
      const carreraNombre = carreraObj?.nombre || userCarrera;
      createNotificationByCarrera(
        carreraNombre,
        `Nuevo PDF disponible: ${formData.nombre.trim()}`,
        'pdf',
        newPDF.id
      );

      setPDFs(getPDFs());
      toast({
        title: 'Éxito',
        description: 'PDF subido correctamente. Los estudiantes de tu carrera serán notificados.',
      });
      handleCloseDialog();
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = () => {
    if (selectedPDF) {
      // Verificar permisos antes de eliminar
      if (selectedPDF.carrera !== carreraId && selectedPDF.carrera.toLowerCase() !== userCarrera.toLowerCase()) {
        toast({
          title: 'Error',
          description: 'No tienes permisos para eliminar PDFs de otras carreras.',
          variant: 'destructive',
        });
        setIsDeleteDialogOpen(false);
        setSelectedPDF(null);
        return;
      }

      const deleted = deletePDF(selectedPDF.id);
      if (deleted) {
        setPDFs(getPDFs());
        toast({
          title: 'Éxito',
          description: 'PDF eliminado correctamente.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el PDF.',
          variant: 'destructive',
        });
      }
      setIsDeleteDialogOpen(false);
      setSelectedPDF(null);
    }
  };

  const openDeleteDialog = (pdf: PDF) => {
    // Verificar permisos
    if (pdf.carrera !== carreraId && pdf.carrera.toLowerCase() !== userCarrera.toLowerCase()) {
      toast({
        title: 'Error',
        description: 'No tienes permisos para eliminar PDFs de otras carreras.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedPDF(pdf);
    setIsDeleteDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de PDFs - {carreraObj?.nombre || userCarrera}</h1>
            <p className="text-muted-foreground">Administra los documentos PDF de tu carrera</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Subir PDF
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>PDFs de {carreraObj?.nombre || userCarrera}</CardTitle>
            <CardDescription>Lista de documentos PDF de tu carrera</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {filteredPDFs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>No hay PDFs disponibles para tu carrera.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPDFs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <FileText className="h-8 w-8 text-red-500" />
                      <div className="flex-1">
                        <h3 className="font-medium">{pdf.nombre}</h3>
                        {pdf.descripcion && (
                          <p className="text-sm text-muted-foreground">{pdf.descripcion}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Subido el {new Date(pdf.fecha).toLocaleDateString('es-ES')}
                          {pdf.tamaño && ` • ${(pdf.tamaño / 1024).toFixed(2)} KB`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(pdf)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(pdf)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog para crear/editar PDF */}
        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedPDF ? 'Editar PDF' : 'Subir Nuevo PDF'}</DialogTitle>
              <DialogDescription>
                {selectedPDF
                  ? 'Modifica la información del PDF. No se puede cambiar el archivo.'
                  : `Sube un archivo PDF para ${carreraObj?.nombre || userCarrera}.`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del PDF *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Guía de Programación I"
                />
              </div>
              {!selectedPDF && (
                <div className="space-y-2">
                  <Label htmlFor="archivo">Archivo PDF *</Label>
                  <Input
                    id="archivo"
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción (opcional)</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Breve descripción del contenido del PDF..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {selectedPDF ? 'Actualizar' : 'Subir PDF'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmación de eliminación */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar PDF?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El PDF será eliminado permanentemente y los estudiantes ya no podrán acceder a él.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default CoordinadorPDFs;

