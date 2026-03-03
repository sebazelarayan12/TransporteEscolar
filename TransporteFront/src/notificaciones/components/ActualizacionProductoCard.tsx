import { formatDateTime } from '../../shared/utils/date.helpers';
import type { NotificacionResponse } from '../types/notificacion.types';

type ActualizacionProductoCardVariant = 'panel' | 'banner';

interface ActualizacionProductoCardProps {
  notificacion: NotificacionResponse;
  variant?: ActualizacionProductoCardVariant;
}

const variantClasses: Record<ActualizacionProductoCardVariant, string> = {
  panel:
    'rounded-2xl border border-cyan-100 bg-gradient-to-b from-cyan-50/80 via-white to-white p-4 shadow-sm dark:border-cyan-900/40 dark:from-cyan-900/20 dark:via-zinc-900 dark:to-zinc-900',
  banner:
    'rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900/70',
};

export const ActualizacionProductoCard = ({ notificacion, variant = 'panel' }: ActualizacionProductoCardProps) => {
  const descripcion = notificacion.descripcion ?? notificacion.mensaje;
  const fechaReferencia = notificacion.fechaPublicacion ?? notificacion.fechaCreacion;

  return (
    <div className={`flex flex-col gap-3 ${variantClasses[variant]}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#007a8a] to-cyan-400 text-white shadow-lg shadow-cyan-500/25">
          <span className="material-symbols-outlined text-2xl">auto_awesome</span>
        </div>
        <div className="flex-1">
          <div className="inline-flex items-center gap-1 rounded-full bg-[#007a8a]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#007a8a] dark:bg-cyan-500/10 dark:text-cyan-100">
            <span className="material-symbols-outlined text-base">upgrade</span>
            Actualización del sistema
          </div>
          <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">{notificacion.titulo}</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-600 whitespace-pre-line dark:text-gray-300">{descripcion}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-dashed border-gray-200 pt-3 text-sm text-gray-500 dark:border-white/10 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>Publicado el {formatDateTime(fechaReferencia)}</p>
        {notificacion.link && (
          <a
            href={notificacion.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-[#007a8a]/10 px-3 py-1.5 text-sm font-semibold text-[#007a8a] transition-colors hover:bg-[#007a8a]/20 dark:bg-cyan-500/10 dark:text-cyan-100 dark:hover:bg-cyan-500/20"
          >
            Ver detalles
            <span className="material-symbols-outlined text-base">open_in_new</span>
          </a>
        )}
      </div>
    </div>
  );
};
