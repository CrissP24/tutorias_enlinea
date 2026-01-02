import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTutoriasByDocente, updateTutoria, getUsers } from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Check, X, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tutoria } from '@/types';

const DocenteSolicitudes: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tutorias, setTutorias] = useState<Tutoria[]>(() => user ? getTutoriasByDocente(user.id) : []);
  const users = useMemo(() => getUsers(), []);
  const getUserName = (id: string) => users.find(u => u.id === id)?.nombre || 'Desconocido';

  const refresh = () => user && setTutorias(getTutoriasByDocente(user.id));

  const handleAction = (id: string, estado: 'aceptada' | 'rechazada') => {
    updateTutoria(id, { estado });
    toast({ title: estado === 'aceptada' ? 'Tutoría aceptada' : 'Tutoría rechazada' });
    refresh();
  };

  const pendientes = tutorias.filter(t => t.estado === 'pendiente');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Solicitudes de Tutoría</h1></div>
        <Card>
          <CardHeader><CardTitle>{pendientes.length} solicitud(es) pendiente(s)</CardTitle></CardHeader>
          <CardContent>
            {pendientes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay solicitudes pendientes.</p>
            ) : (
              <div className="space-y-4">
                {pendientes.map(t => (
                  <div key={t.id} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="font-semibold">{t.tema}</h3>
                        <p className="text-sm text-muted-foreground">{t.descripcion}</p>
                        <p className="text-sm"><strong>Estudiante:</strong> {getUserName(t.estudianteId)}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(t.fecha).toLocaleDateString('es-ES')}</span>
                          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{t.hora}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="success" onClick={() => handleAction(t.id, 'aceptada')}><Check className="mr-1 h-4 w-4" />Aceptar</Button>
                        <Button variant="destructive" onClick={() => handleAction(t.id, 'rechazada')}><X className="mr-1 h-4 w-4" />Rechazar</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DocenteSolicitudes;
