import React from 'react';
import type { TutoriaStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: TutoriaStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const statusConfig = {
    pendiente: {
      label: 'Pendiente',
      className: 'bg-accent/10 text-accent border-accent/20',
    },
    aceptada: {
      label: 'Aceptada',
      className: 'bg-primary/10 text-primary border-primary/20',
    },
    rechazada: {
      label: 'Rechazada',
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
    finalizada: {
      label: 'Finalizada',
      className: 'bg-success/10 text-success border-success/20',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        config.className
      )}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
