import {
  useNotificaciones,
  useNotificacionesCountNoLeidas,
  useMarcarNotificacionLeida,
  useMarcarTodasNotificacionesLeidas,
  useEliminarNotificacion,
  useUltimaActualizacionNotificacion,
} from '../services/notificaciones.queries';

/**
 * Datos y acciones del panel de notificaciones: contador, listado (sin repetir la
 * última actualización del sistema) y acciones de lectura / borrado.
 */
export const useNotificacionesPanel = () => {
  const { data: countData } = useNotificacionesCountNoLeidas();
  const { data: notificacionesData, isLoading, refetch: refetchNotificaciones } = useNotificaciones({ pageSize: 10 });
  const {
    data: ultimaActualizacion,
    isLoading: isActualizacionLoading,
    refetch: refetchUltimaActualizacion,
  } = useUltimaActualizacionNotificacion();
  const marcarLeida = useMarcarNotificacionLeida();
  const marcarTodasLeidas = useMarcarTodasNotificacionesLeidas();
  const eliminarNotificacion = useEliminarNotificacion();

  const notificaciones = notificacionesData?.data ?? [];
  const otrasNotificaciones = notificaciones.filter((item) => item.id !== ultimaActualizacion?.id);
  const hasOtrasNotificaciones = otrasNotificaciones.length > 0;

  return {
    count: countData?.count ?? 0,
    isLoading,
    isActualizacionLoading,
    ultimaActualizacion,
    otrasNotificaciones,
    hasOtrasNotificaciones,
    shouldShowEmptyState: !isLoading && !ultimaActualizacion && !hasOtrasNotificaciones,
    hasContent: hasOtrasNotificaciones || Boolean(ultimaActualizacion),
    isMarkingAllRead: marcarTodasLeidas.isPending,
    refetchAll: () => {
      refetchNotificaciones();
      refetchUltimaActualizacion();
    },
    marcarLeida: (id: number) => marcarLeida.mutate(id),
    eliminar: (id: number) => eliminarNotificacion.mutate(id),
    marcarTodasLeidas: () => marcarTodasLeidas.mutate(),
  };
};
