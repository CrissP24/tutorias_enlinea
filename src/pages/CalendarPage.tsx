import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TutoriasCalendar from '@/components/calendar/TutoriasCalendar';

const CalendarPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendario de Tutorías</h1>
          <p className="text-muted-foreground">Visualiza y gestiona las tutorías programadas</p>
        </div>
        <TutoriasCalendar />
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;
