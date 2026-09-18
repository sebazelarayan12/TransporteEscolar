import { useRef, useState } from 'react';
import { Spinner } from '../../shared/ui/Spinner';
import { useClickOutside } from '../../shared/hooks/useClickOutside';
import { useNotificacionesPanel } from '../hooks/useNotificacionesPanel';
import { NotificacionItem } from './NotificacionItem';
import { ActualizacionProductoCard } from './ActualizacionProductoCard';

type PanelData = ReturnType<typeof useNotificacionesPanel>;

interface NotificacionesBellProps {
  count: number;
  isOpen: boolean;
  onToggle: () => void;
}

const NotificacionesBell = ({ count, isOpen, onToggle }: NotificacionesBellProps) => (
  <button
    type="button"
    onClick={onToggle}
    className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-cyan-600 dark:text-gray-300 dark:hover:bg-white/10"
    aria-label="Notificaciones"
    aria-expanded={isOpen}
    aria-haspopup="true"
  >
    <span className="material-symbols-outlined text-2xl">notifications</span>
    {count > 0 && (
      <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
        {count > 99 ? '99+' : count}
      </span>
    )}
  </button>
);

const EmptyNotificaciones = () => (
  <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
    <span className="material-symbols-outlined text-3xl text-gray-300 dark:text-gray-600">notifications_off</span>
    <p className="text-sm text-gray-500 dark:text-gray-400">No hay notificaciones</p>
  </div>
);

interface NotificacionesListProps {
  panel: PanelData;
  onClose: () => void;
}

const NotificacionesList = ({ panel, onClose }: NotificacionesListProps) => (
  <div className="max-h-96 overflow-y-auto p-3 space-y-3">
    {panel.isActualizacionLoading && !panel.ultimaActualizacion && (
      <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-400 animate-pulse dark:border-white/10">
        Cargando actualización del sistema...
      </div>
    )}

    {panel.ultimaActualizacion && <ActualizacionProductoCard notificacion={panel.ultimaActualizacion} />}

    {panel.isLoading && (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    )}

    {!panel.isLoading && panel.hasOtrasNotificaciones && (
      <div className="space-y-1">
        {panel.otrasNotificaciones.map((notificacion) => (
          <NotificacionItem
            key={notificacion.id}
            notificacion={notificacion}
            onMarcarLeida={panel.marcarLeida}
            onEliminar={panel.eliminar}
            onClose={onClose}
          />
        ))}
      </div>
    )}

    {panel.shouldShowEmptyState && <EmptyNotificaciones />}
  </div>
);

const NotificacionesPanel = ({ panel, onClose }: NotificacionesListProps) => (
  // En mobile usa ancho limitado alineado a la derecha, en desktop se expande
  <div className="absolute right-0 top-full z-[70] mt-2 w-[calc(100vw-2rem)] max-w-96 rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900 sm:w-96">
    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
      {panel.count > 0 && (
        <button
          type="button"
          onClick={panel.marcarTodasLeidas}
          disabled={panel.isMarkingAllRead}
          className="text-xs font-medium text-cyan-600 hover:text-cyan-700 disabled:opacity-50 dark:text-cyan-400 dark:hover:text-cyan-300"
        >
          Marcar todas como leidas
        </button>
      )}
    </div>

    <NotificacionesList panel={panel} onClose={onClose} />

    {panel.hasContent && (
      <div className="border-t border-gray-100 px-4 py-3 dark:border-white/5">
        <button
          type="button"
          onClick={onClose}
          className="w-full text-center text-xs font-medium text-gray-500 hover:text-cyan-600 dark:text-gray-400 dark:hover:text-cyan-400"
        >
          Cerrar
        </button>
      </div>
    )}
  </div>
);

export const NotificacionesDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const panel = useNotificacionesPanel();

  const close = () => setIsOpen(false);
  useClickOutside(dropdownRef, isOpen, close);

  const handleToggle = () => {
    if (!isOpen) {
      panel.refetchAll();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div ref={dropdownRef} className="relative z-[60]">
      <NotificacionesBell count={panel.count} isOpen={isOpen} onToggle={handleToggle} />
      {isOpen && <NotificacionesPanel panel={panel} onClose={close} />}
    </div>
  );
};
