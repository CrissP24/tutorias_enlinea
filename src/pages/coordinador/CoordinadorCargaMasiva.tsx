import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ExcelUploadCoordinador from '@/components/coordinador/ExcelUploadCoordinador';

const CoordinadorCargaMasiva: React.FC = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    // Opcional: redirigir o mostrar mensaje de éxito
    // Puedes agregar lógica adicional aquí si es necesario
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Carga Masiva de Estudiantes</h1>
          <p className="text-muted-foreground">Carga estudiantes de tu carrera mediante archivo Excel</p>
        </div>
        <ExcelUploadCoordinador onComplete={handleComplete} />
      </div>
    </DashboardLayout>
  );
};

export default CoordinadorCargaMasiva;

