import { useMemo, useState } from 'react';
import type { PagoMensual, PaymentStatus } from '../types/pago.types';

type FilterOption = 'all' | PaymentStatus;

export function usePagosList(pagos: PagoMensual[] = []) {
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

  // Aplicar filtros
  const filteredPagos = useMemo(() => {
    let result = pagos;

    // Filtro por estado
    if (selectedFilter !== 'all') {
      result = result.filter((pago) => {
        if (selectedFilter === 'pagado') return pago.estaPagado;
        if (selectedFilter === 'vencido') return pago.estaVencido;
        if (selectedFilter === 'parcial') return !pago.estaPagado && !pago.estaVencido;
        return true;
      });
    }

    // Búsqueda por titular
    if (searchQuery) {
      const normalized = searchQuery.toLowerCase().trim();
      result = result.filter((pago) => pago.titularApellido.toLowerCase().includes(normalized));
    }

    return result;
  }, [pagos, selectedFilter, searchQuery]);

  // Calcular totales de los pagos filtrados
  const totals = useMemo(() => {
    return filteredPagos.reduce(
      (acc, pago) => {
        acc.generated += pago.montoGenerado;
        acc.paid += pago.totalPagado;
        acc.balance += pago.saldoPendiente;
        return acc;
      },
      { generated: 0, paid: 0, balance: 0 }
    );
  }, [filteredPagos]);

  // Contar por estado para los badges de filtros
  const filterCounts = useMemo(() => {
    const pagados = pagos.filter((p) => p.estaPagado).length;
    const vencidos = pagos.filter((p) => p.estaVencido).length;
    const parciales = pagos.filter((p) => !p.estaPagado && !p.estaVencido).length;

    return {
      all: pagos.length,
      pagado: pagados,
      vencido: vencidos,
      parcial: parciales,
    };
  }, [pagos]);

  return {
    filteredPagos,
    totals,
    filterCounts,
    selectedFilter,
    setSelectedFilter,
    searchQuery,
    setSearchQuery,
    selectedInvoiceId,
    setSelectedInvoiceId,
  };
}
