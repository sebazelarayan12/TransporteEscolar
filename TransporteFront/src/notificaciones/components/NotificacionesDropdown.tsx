import { useState, useRef, useEffect } from 'react';
import { Spinner } from '../../shared/ui/Spinner';
import { NotificacionItem } from './NotificacionItem';
import {
  useNotificaciones,
  useNotificacionesCountNoLeidas,
  useMarcarNotificacionLeida,
  useMarcarTodasNotificacionesLeidas,
  useEliminarNotificacion,
} from '../services/notificaciones.queries';

export const NotificacionesDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: countData } = useNotificacionesCountNoLeidas();
  const { data: notificacionesData, isLoading, refetch } = useNotificaciones({ pageSize: 10 });
  const marcarLeida = useMarcarNotificacionLeida();
  const marcarTodasLeidas = useMarcarTodasNotificacionesLeidas();
  const eliminarNotificacion = useEliminarNotificacion();

  const count = countData?.count ?? 0;
  const notificaciones = notificacionesData?.data ?? [];

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      refetch();
    }
    setIsOpen(!isOpen);
  };

  const handleMarcarLeida = (id: number) => {
    marcarLeida.mutate(id);
  };

  const handleEliminar = (id: number) => {
    eliminarNotificacion.mutate(id);
  };

  const handleMarcarTodasLeidas = () => {
    marcarTodasLeidas.mutate();
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Boton de campana */}
      <button
        type="button"
        onClick={handleToggle}
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

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900 z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
            {count > 0 && (
              <button
                type="button"
                onClick={handleMarcarTodasLeidas}
                disabled={marcarTodasLeidas.isPending}
                className="text-xs font-medium text-cyan-600 hover:text-cyan-700 disabled:opacity-50 dark:text-cyan-400 dark:hover:text-cyan-300"
              >
                Marcar todas como leidas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto p-2">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            )}

            {!isLoading && notificaciones.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <span className="material-symbols-outlined text-3xl text-gray-300 dark:text-gray-600">
                  notifications_off
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay notificaciones
                </p>
              </div>
            )}

            {!isLoading && notificaciones.length > 0 && (
              <div className="space-y-1">
                {notificaciones.map((notificacion) => (
                  <NotificacionItem
                    key={notificacion.id}
                    notificacion={notificacion}
                    onMarcarLeida={handleMarcarLeida}
                    onEliminar={handleEliminar}
                    onClose={handleClose}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notificaciones.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-3 dark:border-white/5">
              <button
                type="button"
                onClick={handleClose}
                className="w-full text-center text-xs font-medium text-gray-500 hover:text-cyan-600 dark:text-gray-400 dark:hover:text-cyan-400"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
