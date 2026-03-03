import type { NotificacionTipo } from '../types/notificacion.types';

interface NotificacionConfig {
  icon: string;
  colorClass: string;
  bgColorClass: string;
  label: string;
  getRoute: (entidadId: number | null) => string | null;
}

/**
 * Configuración visual y de navegación para cada tipo de notificación
 */
export const NOTIFICACION_CONFIG: Record<NotificacionTipo, NotificacionConfig> = {
  PAGO_REGISTRADO: {
    icon: 'payments',
    colorClass: 'text-emerald-500',
    bgColorClass: 'bg-emerald-500/10',
    label: 'Pago registrado',
    getRoute: (id) => (id ? `/pagos?pagoId=${id}` : '/pagos'),
  },
  AJUSTE_MONTO: {
    icon: 'tune',
    colorClass: 'text-amber-500',
    bgColorClass: 'bg-amber-500/10',
    label: 'Ajuste de monto',
    getRoute: (id) => (id ? `/titulares/${id}` : '/titulares'),
  },
  REINSCRIPCION: {
    icon: 'how_to_reg',
    colorClass: 'text-blue-500',
    bgColorClass: 'bg-blue-500/10',
    label: 'Reinscripcion',
    getRoute: (id) => (id ? `/titulares/${id}` : '/reinscripciones'),
  },
  TITULAR_CREADO: {
    icon: 'person_add',
    colorClass: 'text-cyan-500',
    bgColorClass: 'bg-cyan-500/10',
    label: 'Nuevo titular',
    getRoute: (id) => (id ? `/titulares/${id}` : '/titulares'),
  },
  PASAJERO_CREADO: {
    icon: 'school',
    colorClass: 'text-purple-500',
    bgColorClass: 'bg-purple-500/10',
    label: 'Nuevo pasajero',
    getRoute: (id) => (id ? `/pasajeros/${id}` : '/pasajeros'),
  },
  ACTUALIZACION_PRODUCTO: {
    icon: 'auto_awesome',
    colorClass: 'text-[#007a8a]',
    bgColorClass: 'bg-[#007a8a]/10',
    label: 'Actualización del sistema',
    getRoute: () => null,
  },
} as const;

/**
 * Intervalo de polling para el contador de notificaciones no leídas (30 segundos)
 */
export const POLLING_INTERVAL_MS = 30000;
