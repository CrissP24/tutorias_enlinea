import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTutoriasByDocente, getUsers } from '@/lib/storage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from '@/components/ui/star-rating';

const DocenteCalificaciones: React.FC = () => {
  const { user } = useAuth();
  const tutorias = useMemo(() => user ? getTutoriasByDocente(user.id).filter(t => t.calificacion) : [], [user]);
  const users = useMemo(() => getUsers(), []);
  const getUserName = (id: string) => users.find(u => u.id === id)?.nombre || 'Desconocido';
  const promedio = tutorias.length ? tutorias.reduce((a, t) => a + t.calificacion!, 0) / tutorias.length : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Mis Calificaciones</h1>
        <Card className="gradient-hero text-primary-foreground">
          <CardContent className="p-6 text-center">
            <p className="text-lg">Promedio General</p>
            <p className="text-4xl font-bold">{promedio.toFixed(1)} / 5.0</p>
            <p className="text-sm opacity-80">{tutorias.length} calificación(es)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Calificaciones Recibidas</CardTitle></CardHeader>
          <CardContent>
            {tutorias.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aún no tienes calificaciones.</p>
            ) : (
              <div className="space-y-4">
                {tutorias.map(t => (
                  <div key={t.id} className="rounded-xl border p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{t.tema}</h3>
                        <p className="text-sm text-muted-foreground">Por: {getUserName(t.estudianteId)}</p>
                        {t.comentario && <p className="text-sm italic mt-2">"{t.comentario}"</p>}
                      </div>
                      <StarRating value={t.calificacion!} readonly />
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

export default DocenteCalificaciones;
