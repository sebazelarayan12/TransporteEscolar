import { useNavigate } from 'react-router-dom';
import type { NotificacionResponse } from '../types/notificacion.types';
import { NOTIFICACION_CONFIG } from '../constants/notificacion.constants';

interface NotificacionItemProps {
  notificacion: NotificacionResponse;
  onMarcarLeida: (id: number) => void;
  onEliminar: (id: number) => void;
  onClose: () => void;
}

/**
 * Formatea una fecha ISO en un texto relativo legible
 */
const formatTimeAgo = (fechaIso: string): string => {
  const fecha = new Date(fechaIso);
  const ahora = new Date();
  const diffMs = ahora.getTime() - fecha.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  return `Hace ${diffDays} dias`;
};

export const NotificacionItem = ({ notificacion, onMarcarLeida, onEliminar, onClose }: NotificacionItemProps) => {
  const navigate = useNavigate();
  const config = NOTIFICACION_CONFIG[notificacion.tipo];

  const handleClick = () => {
    if (!notificacion.leida) {
      onMarcarLeida(notificacion.id);
    }

    const route = config.getRoute(notificacion.entidadId);
    if (route) {
      onClose();
      navigate(route);
    }
  };

  const handleEliminar = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEliminar(notificacion.id);
  };

  return (
    <div
      className={`
        group relative w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors
        hover:bg-gray-50 dark:hover:bg-white/5
        ${!notificacion.leida ? 'bg-cyan-500/5 dark:bg-cyan-500/10' : ''}
      `}
    >
      {/* Botón clickeable para toda el área */}
      <button
        type="button"
        onClick={handleClick}
        className="absolute inset-0 z-0"
        aria-label="Ver notificación"
      />

      {/* Icono */}
      <div className={`relative z-10 flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl ${config.bgColorClass}`}>
        <span className={`material-symbols-outlined text-xl ${config.colorClass}`}>
          {config.icon}
        </span>
      </div>

      {/* Contenido */}
      <div className="relative z-10 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium ${!notificacion.leida ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
            {notificacion.titulo}
          </p>
          {!notificacion.leida && (
            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-cyan-500" />
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
          {notificacion.mensaje}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {formatTimeAgo(notificacion.fechaCreacion)}
        </p>
      </div>

      {/* Botón eliminar */}
      <button
        type="button"
        onClick={handleEliminar}
        className="relative z-20 flex-shrink-0 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
        aria-label="Eliminar notificación"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
};
