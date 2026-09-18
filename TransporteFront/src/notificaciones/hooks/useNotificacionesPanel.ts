import {
  useNotificaciones,
  useNotificacionesCountNoLeidas,
  useMarcarNotificacionLeida,
  useMarcarTodasNotificacionesLeidas,
  useEliminarNotificacion,
} from '../services/notificaciones.queries';

/**
 * Datos y acciones del panel de notificaciones: contador, listado y acciones
 * de lectura / borrado.
 */
export const useNotificacionesPanel = () => {
  const { data: countData } = useNotificacionesCountNoLeidas();
  const { data: notificacionesData, isLoading, refetch } = useNotificaciones({ pageSize: 10 });
  const marcarLeida = useMarcarNotificacionLeida();
  const marcarTodasLeidas = useMarcarTodasNotificacionesLeidas();
  const eliminarNotificacion = useEliminarNotificacion();

  const notificaciones = notificacionesData?.data ?? [];
  const hasNotificaciones = notificaciones.length > 0;

  return {
    count: countData?.count ?? 0,
    isLoading,
    notificaciones,
    hasNotificaciones,
    shouldShowEmptyState: !isLoading && !hasNotificaciones,
    isMarkingAllRead: marcarTodasLeidas.isPending,
    refetchAll: () => {
      refetch();
    },
    marcarLeida: (id: number) => marcarLeida.mutate(id),
    eliminar: (id: number) => eliminarNotificacion.mutate(id),
    marcarTodasLeidas: () => marcarTodasLeidas.mutate(),
  };
};
