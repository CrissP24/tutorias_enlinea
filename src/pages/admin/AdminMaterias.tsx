import React, { useState, useMemo } from 'react';
import { getMaterias, getCarreras, updateMateria, deleteMateria, getUsers } from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, BookOpen, CheckCircle, XCircle, Clock, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ExcelUploadMalla from '@/components/admin/ExcelUploadMalla';
import type { Materia } from '@/types';

const AdminMaterias: React.FC = () => {
  const { toast } = useToast();
  const [materias, setMaterias] = useState<Materia[]>(getMaterias());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'all' | 'pendiente' | 'aprobada' | 'rechazada'>('all');
  const [filterCarrera, setFilterCarrera] = useState<string>('all');
  const [isAprobarDialogOpen, setIsAprobarDialogOpen] = useState(false);
  const [isRechazarDialogOpen, setIsRechazarDialogOpen] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);

  const carreras = useMemo(() => getCarreras(), []);
  const users = useMemo(() => getUsers(), []);

  const filteredMaterias = useMemo(() => {
    return materias.filter(materia => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        materia.nombre.toLowerCase().includes(search) ||
        materia.codigo.toLowerCase().includes(search);
      const matchesEstado = filterEstado === 'all' || materia.estado === filterEstado;
      const matchesCarrera = filterCarrera === 'all' || materia.carreraId === filterCarrera;
      
      return matchesSearch && matchesEstado && matchesCarrera;
    });
  }, [materias, searchTerm, filterEstado, filterCarrera]);

  const refreshMaterias = () => setMaterias(getMaterias());

  const getCarreraNombre = (carreraId: string) => {
    const carrera = carreras.find(c => c.id === carreraId);
    return carrera?.nombre || 'Desconocida';
  };

  const getCoordinadorNombre = (coordinadorId?: string) => {
    if (!coordinadorId) return 'N/A';
    const coordinador = users.find(u => u.id === coordinadorId);
    return coordinador ? `${coordinador.nombres} ${coordinador.apellidos}` : 'Desconocido';
  };

  const handleAprobar = () => {
    if (!selectedMateria) return;
    const result = updateMateria(selectedMateria.id, { estado: 'aprobada', activa: true });
    if (result) {
      toast({ title: 'Materia aprobada', description: 'La materia ha sido aprobada exitosamente.' });
      refreshMaterias();
    }
    setIsAprobarDialogOpen(false);
    setSelectedMateria(null);
  };

  const handleRechazar = () => {
    if (!selectedMateria) return;
    const result = updateMateria(selectedMateria.id, { estado: 'rechazada', activa: false });
    if (result) {
      toast({ title: 'Materia rechazada', description: 'La materia ha sido rechazada.' });
      refreshMaterias();
    }
    setIsRechazarDialogOpen(false);
    setSelectedMateria(null);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'aprobada':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Aprobada</Badge>;
      case 'rechazada':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rechazada</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Materias</h1>
          <p className="text-muted-foreground">Gestiona materias y carga malla curricular completa</p>
        </div>

        <Tabs defaultValue="materias" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="materias">
              <BookOpen className="mr-2 h-4 w-4" />
              Materias
            </TabsTrigger>
            <TabsTrigger value="malla">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Cargar Malla Curricular
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="malla" className="space-y-4">
            <ExcelUploadMalla onComplete={refreshMaterias} />
          </TabsContent>

          <TabsContent value="materias" className="space-y-4">

        <Card>
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o código..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Select value={filterEstado} onValueChange={(value) => setFilterEstado(value as typeof filterEstado)}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="aprobada">Aprobada</SelectItem>
                <SelectItem value="rechazada">Rechazada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCarrera} onValueChange={setFilterCarrera}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Carrera" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las carreras</SelectItem>
                {carreras.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Materias ({filteredMaterias.length})</CardTitle></CardHeader>
          <CardContent>
            {filteredMaterias.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay materias registradas.</p>
            ) : (
              <div className="space-y-4">
                {filteredMaterias.map((materia) => (
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
                        <p className="text-sm text-muted-foreground">Código: {materia.codigo} | Carrera: {getCarreraNombre(materia.carreraId)}</p>
                        {materia.descripcion && (
                          <p className="text-sm text-muted-foreground mt-1">{materia.descripcion}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Creada por: {getCoordinadorNombre(materia.coordinadorId)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getEstadoBadge(materia.estado)}
                      {materia.estado === 'pendiente' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => { setSelectedMateria(materia); setIsAprobarDialogOpen(true); }}>
                            <CheckCircle className="h-4 w-4 mr-1" />Aprobar
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive" onClick={() => { setSelectedMateria(materia); setIsRechazarDialogOpen(true); }}>
                            <XCircle className="h-4 w-4 mr-1" />Rechazar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={isAprobarDialogOpen} onOpenChange={setIsAprobarDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Aprobar materia?</AlertDialogTitle>
              <AlertDialogDescription>
                Se aprobará la materia <strong>{selectedMateria?.nombre}</strong> y quedará disponible en el sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleAprobar}>Aprobar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isRechazarDialogOpen} onOpenChange={setIsRechazarDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Rechazar materia?</AlertDialogTitle>
              <AlertDialogDescription>
                Se rechazará la materia <strong>{selectedMateria?.nombre}</strong> y no estará disponible en el sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleRechazar} className="bg-destructive text-destructive-foreground">Rechazar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminMaterias;






