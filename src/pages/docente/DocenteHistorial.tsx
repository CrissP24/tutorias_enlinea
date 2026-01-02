import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTutoriasByDocente, getUsers } from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';

const DocenteHistorial: React.FC = () => {
  const { user } = useAuth();
  const tutorias = useMemo(() => user ? getTutoriasByDocente(user.id).filter(t => t.estado !== 'pendiente') : [], [user]);
  const users = useMemo(() => getUsers(), []);
  const getUserName = (id: string) => users.find(u => u.id === id)?.nombre || 'Desconocido';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Historial de Tutorías</h1>
        <Card>
          <CardHeader><CardTitle>{tutorias.length} tutoría(s)</CardTitle></CardHeader>
          <CardContent>
            {tutorias.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay tutorías en el historial.</p>
            ) : (
              <div className="space-y-4">
                {tutorias.map(t => (
                  <div key={t.id} className="rounded-xl border p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{t.tema}</h3>
                      <p className="text-sm text-muted-foreground">Estudiante: {getUserName(t.estudianteId)}</p>
                    </div>
                    <StatusBadge status={t.estado} />
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

export default DocenteHistorial;
