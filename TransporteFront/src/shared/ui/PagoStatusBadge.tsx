type PagoEstado = 'pendiente' | 'vencido' | 'pagado';

interface PagoStatusBadgeProps {
  estado: PagoEstado;
  className?: string;
}

const ESTADO_CONFIG = {
  pagado: {
    label: 'Pagado',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: 'check_circle',
  },
  pendiente: {
    label: 'Pendiente',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: 'schedule',
  },
  vencido: {
    label: 'Vencido',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: 'error',
  },
};

export const PagoStatusBadge = ({ estado, className = '' }: PagoStatusBadgeProps) => {
  const config = ESTADO_CONFIG[estado];
  
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className} ${className}`}>
      <span className="material-symbols-outlined text-[16px]">{config.icon}</span>
      {config.label}
    </span>
  );
};
