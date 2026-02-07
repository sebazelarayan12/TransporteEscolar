import type { PagoMensual, PagoEstado } from '../types/pago.types';

/**
 * Formatea un monto a moneda argentina
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Determina el estado de un pago mensual
 */
export function getPagoEstado(pago: PagoMensual): PagoEstado {
  if (pago.estaPagado) return 'pagado';
  if (pago.estaVencido) return 'vencido';
  return 'pendiente';
}

/**
 * Determina si un pago mensual pertenece al ciclo lectivo actual.
 * Ciclo lectivo: Marzo (año X) - Diciembre (año X), con extensión hasta Febrero (año X+1).
 * 
 * Regla:
 * - Si estamos en Enero-Febrero: ciclo actual es el año anterior
 * - Si estamos en Marzo-Diciembre: ciclo actual es el año en curso
 * 
 * @example
 * Hoy es Octubre 2024
 * - Marzo 2024 → Ciclo actual ✅
 * - Diciembre 2024 → Ciclo actual ✅
 * - Enero 2025 → Ciclo actual ✅ (parte del ciclo 2024)
 * - Febrero 2025 → Ciclo actual ✅ (parte del ciclo 2024)
 * - Marzo 2025 → Histórico ❌ (todavía no llegamos)
 * - Diciembre 2023 → Histórico ❌ (ciclo anterior)
 */
export function esCicloActual(mes: number, anio: number): boolean {
  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1; // 1-12
  const anioActual = hoy.getFullYear();

  // Determinar el año del ciclo actual
  // Si estamos en Enero-Febrero, el ciclo actual es del año anterior
  const anioCicloActual = mesActual <= 2 ? anioActual - 1 : anioActual;

  // Un pago es del ciclo actual si:
  // 1. Es del mismo año del ciclo Y mes >= 3 (marzo a diciembre)
  if (anio === anioCicloActual && mes >= 3) return true;

  // 2. O es del año siguiente Y mes <= 2 (enero, febrero del siguiente año)
  if (anio === anioCicloActual + 1 && mes <= 2) return true;

  return false;
}

/**
 * Agrupa pagos mensuales por periodo (mes-año)
 * Ordena los grupos: más recientes primero
 */
export function agruparPorPeriodo(pagos: PagoMensual[]) {
  const grupos = new Map<
    string,
    {
      id: string;
      title: string;
      badge: string;
      muted: boolean;
      pagos: PagoMensual[];
    }
  >();

  pagos.forEach((pago) => {
    const key = `${pago.mes}-${pago.anio}`;
    const esActual = esCicloActual(pago.mes, pago.anio);

    if (!grupos.has(key)) {
      grupos.set(key, {
        id: key,
        title: pago.periodo,
        badge: esActual ? 'Ciclo actual' : 'Histórico',
        muted: !esActual,
        pagos: [],
      });
    }

    grupos.get(key)!.pagos.push(pago);
  });

  // Ordenar grupos: más recientes primero
  return Array.from(grupos.values()).sort((a, b) => {
    const [mesA, anioA] = a.id.split('-').map(Number);
    const [mesB, anioB] = b.id.split('-').map(Number);
    // Ordenar por año descendente, luego por mes descendente
    return anioB - anioA || mesB - mesA;
  });
}
