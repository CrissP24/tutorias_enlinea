import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  createTutoria, 
  getMaterias, 
  getSemestres, 
  getCarreras,
  getDocentesByMateriaSemestre,
  getMateriasBySemestre,
  getSemestreByNombre,
  getCarreraById
} from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const EstudianteSolicitar: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    materiaId: '', 
    docenteId: '', 
    tema: '', 
    descripcion: '', 
    fecha: '', 
    hora: '' 
  });

  // Obtener datos del estudiante
  const estudianteSemestre = useMemo(() => {
    if (!user || !user.semestre) return null;
    return getSemestreByNombre(user.semestre);
  }, [user]);

  const estudianteCarrera = useMemo(() => {
    if (!user || !user.carrera) return null;
    const carreras = getCarreras();
    return carreras.find(c => c.nombre === user.carrera);
  }, [user]);

  // Obtener materias del semestre del estudiante
  const materiasDisponibles = useMemo(() => {
    if (!estudianteSemestre) return [];
    const materias = getMateriasBySemestre(estudianteSemestre.id);
    // Filtrar solo materias de la carrera del estudiante
    if (estudianteCarrera) {
      return materias.filter(m => m.carreraId === estudianteCarrera.id);
    }
    return materias;
  }, [estudianteSemestre, estudianteCarrera]);

  // Obtener docentes filtrados por materia, semestre y carrera
  const docentesDisponibles = useMemo(() => {
    if (!formData.materiaId || !estudianteSemestre || !estudianteCarrera) return [];
    return getDocentesByMateriaSemestre(formData.materiaId, estudianteSemestre.id, estudianteCarrera.id);
  }, [formData.materiaId, estudianteSemestre, estudianteCarrera]);

  // Validar fecha y hora
  const validateFechaHora = (fecha: string, hora: string): string | null => {
    if (!fecha || !hora) return null;
    
    const ahora = new Date();
    const fechaSeleccionada = new Date(`${fecha}T${hora}`);
    
    if (fechaSeleccionada <= ahora) {
      return 'La fecha y hora deben ser posteriores a la fecha y hora actual';
    }
    
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !estudianteSemestre) {
      toast({ 
        title: 'Error', 
        description: 'No se pudo obtener la información del estudiante.', 
        variant: 'destructive' 
      });
      return;
    }

    // Validar campos obligatorios
    if (!formData.materiaId || !formData.docenteId || !formData.tema || !formData.descripcion || !formData.fecha || !formData.hora) {
      toast({ 
        title: 'Error', 
        description: 'Por favor completa todos los campos obligatorios.', 
        variant: 'destructive' 
      });
      return;
    }

    // Validar fecha y hora
    const errorValidacion = validateFechaHora(formData.fecha, formData.hora);
    if (errorValidacion) {
      toast({ 
        title: 'Error', 
        description: errorValidacion, 
        variant: 'destructive' 
      });
      return;
    }

    setIsLoading(true);
    
    try {
      createTutoria({ 
        estudianteId: user.id,
        docenteId: formData.docenteId,
        materiaId: formData.materiaId,
        semestreId: estudianteSemestre.id,
        tema: formData.tema,
        descripcion: formData.descripcion,
        fecha: formData.fecha,
        hora: formData.hora,
        estado: 'Solicitada' // Estado inicial según requisitos
      });
      
      toast({ 
        title: '¡Solicitud enviada!', 
        description: 'El docente revisará tu solicitud.' 
      });
      
      // Limpiar formulario
      setFormData({ 
        materiaId: '', 
        docenteId: '', 
        tema: '', 
        descripcion: '', 
        fecha: '', 
        hora: '' 
      });
      
      navigate('/estudiante/historial');
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'No se pudo crear la solicitud. Intenta nuevamente.', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Limpiar docente cuando cambia la materia
  useEffect(() => {
    if (formData.materiaId && formData.docenteId) {
      const docenteValido = docentesDisponibles.some(d => d.id === formData.docenteId);
      if (!docenteValido) {
        setFormData(prev => ({ ...prev, docenteId: '' }));
      }
    }
  }, [formData.materiaId, docentesDisponibles]);

  // Establecer fecha mínima como hoy
  const fechaMinima = new Date().toISOString().split('T')[0];

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Solicitar Tutoría</h1>
        <Card>
          <CardHeader>
            <CardTitle>Nueva Solicitud</CardTitle>
            <CardDescription>Completa el formulario para solicitar una tutoría</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Semestre - No editable, automático */}
              <div className="space-y-2">
                <Label>Semestre</Label>
                <Input 
                  value={user.semestre || 'No asignado'} 
                  disabled 
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  El semestre se obtiene automáticamente de tu perfil
                </p>
              </div>

              {/* Materia - Lista desplegable filtrada */}
              <div className="space-y-2">
                <Label>Materia <span className="text-destructive">*</span></Label>
                <Select 
                  value={formData.materiaId} 
                  onValueChange={(v) => setFormData({ ...formData, materiaId: v, docenteId: '' })} 
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {materiasDisponibles.length === 0 ? (
                      <SelectItem value="no-materias" disabled>
                        No hay materias disponibles para tu semestre
                      </SelectItem>
                    ) : (
                      materiasDisponibles.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nombre} ({m.codigo})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {materiasDisponibles.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No hay materias disponibles para tu semestre actual
                  </p>
                )}
              </div>

              {/* Docente - Lista desplegable filtrada */}
              <div className="space-y-2">
                <Label>Docente <span className="text-destructive">*</span></Label>
                <Select 
                  value={formData.docenteId} 
                  onValueChange={(v) => setFormData({ ...formData, docenteId: v })} 
                  required
                  disabled={!formData.materiaId || docentesDisponibles.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !formData.materiaId 
                        ? "Primero selecciona una materia" 
                        : docentesDisponibles.length === 0
                        ? "No hay docentes disponibles para esta materia"
                        : "Selecciona un docente"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {docentesDisponibles.length === 0 ? (
                      <SelectItem value="no-docentes" disabled>
                        No hay docentes disponibles
                      </SelectItem>
                    ) : (
                      docentesDisponibles.map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.nombres} {d.apellidos}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {!formData.materiaId && (
                  <p className="text-xs text-muted-foreground">
                    Primero debes seleccionar una materia
                  </p>
                )}
              </div>

              {/* Tema */}
              <div className="space-y-2">
                <Label>Tema <span className="text-destructive">*</span></Label>
                <Input 
                  value={formData.tema} 
                  onChange={(e) => setFormData({ ...formData, tema: e.target.value })} 
                  required 
                  placeholder="Ej: Derivadas e integrales"
                />
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label>Descripción <span className="text-destructive">*</span></Label>
                <Textarea 
                  value={formData.descripcion} 
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} 
                  required 
                  rows={4}
                  placeholder="Describe el tema que necesitas repasar..."
                />
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha <span className="text-destructive">*</span></Label>
                  <Input 
                    type="date" 
                    value={formData.fecha} 
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} 
                    required
                    min={fechaMinima}
                  />
                  <p className="text-xs text-muted-foreground">
                    Debe ser posterior a la fecha actual
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Hora <span className="text-destructive">*</span></Label>
                  <Input 
                    type="time" 
                    value={formData.hora} 
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })} 
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Debe ser posterior a la hora actual
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Solicitud'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EstudianteSolicitar;
