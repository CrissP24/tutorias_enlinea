import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUsersByRole, createTutoria } from '@/lib/storage';
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
  const docentes = useMemo(() => getUsersByRole('docente'), []);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ docenteId: '', tema: '', descripcion: '', fecha: '', hora: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    createTutoria({ ...formData, estudianteId: user.id, estado: 'pendiente' });
    toast({ title: '¡Solicitud enviada!', description: 'El docente revisará tu solicitud.' });
    setIsLoading(false);
    navigate('/estudiante/historial');
  };

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
              <div className="space-y-2">
                <Label>Docente</Label>
                <Select value={formData.docenteId} onValueChange={(v) => setFormData({ ...formData, docenteId: v })} required>
                  <SelectTrigger><SelectValue placeholder="Selecciona un docente" /></SelectTrigger>
                  <SelectContent>
                    {docentes.map(d => <SelectItem key={d.id} value={d.id}>{d.nombres} {d.apellidos}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tema</Label>
                <Input value={formData.tema} onChange={(e) => setFormData({ ...formData, tema: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Input type="time" value={formData.hora} onChange={(e) => setFormData({ ...formData, hora: e.target.value })} required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Enviar Solicitud
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EstudianteSolicitar;
