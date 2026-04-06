import { formatDateTime } from '../../shared/utils/date.helpers';
import type { NotificacionResponse } from '../types/notificacion.types';

interface ActualizacionProductoCardProps {
  notificacion: NotificacionResponse;
}

export const ActualizacionProductoCard = ({ notificacion }: ActualizacionProductoCardProps) => {
  const fechaReferencia = notificacion.fechaPublicacion ?? notificacion.fechaCreacion;
  const titulo = 'Notificaciones';
  const descripcion = 'ahora hay notificaciones';

  return (
    <div className="flex w-full items-start gap-3 rounded-xl border border-dashed border-cyan-500/30 bg-cyan-500/5 p-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-600/10 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-100">
        <span className="material-symbols-outlined text-xl">auto_awesome</span>
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-100">
          <span className="material-symbols-outlined text-sm">upgrade</span>
          Actualización del sistema
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{titulo}</p>
        <p className="text-xs text-gray-600 whitespace-pre-line dark:text-gray-300">{descripcion}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Publicado el {formatDateTime(fechaReferencia)}</span>
          {notificacion.link && (
            <a
              href={notificacion.link}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-300 dark:hover:text-cyan-200"
            >
              Ver detalles
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
