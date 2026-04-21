import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagosList } from '../usePagosList';
import type { PagoMensual } from '../../types/pago.types';

const crearPago = (overrides: Partial<PagoMensual>): PagoMensual => ({
  id: overrides.id ?? 1,
  titularId: 1,
  titularApellido: 'Garcia',
  titularNombre: 'Juan',
  titularDireccion: 'Dir',
  mes: 6,
  anio: 2025,
  periodo: '06/2025',
  montoGenerado: 10000,
  totalPagado: 0,
  saldoPendiente: 10000,
  fechaVencimiento: '2025-06-10T00:00:00Z',
  estaPagado: false,
  estaVencido: false,
  observaciones: null,
  movimientos: [],
  ...overrides,
});

const pagosPagado = crearPago({ id: 1, titularApellido: 'Garcia', estaPagado: true, estaVencido: false, montoGenerado: 5000, totalPagado: 5000, saldoPendiente: 0 });
const pagoVencido = crearPago({ id: 2, titularApellido: 'Lopez', estaPagado: false, estaVencido: true, montoGenerado: 8000, totalPagado: 0, saldoPendiente: 8000 });
const pagoPendiente = crearPago({ id: 3, titularApellido: 'Martinez', estaPagado: false, estaVencido: false, montoGenerado: 6000, totalPagado: 0, saldoPendiente: 6000 });

const todosLosPagos = [pagosPagado, pagoVencido, pagoPendiente];

describe('usePagosList', () => {
  describe('filteredPagos', () => {
    it('sin filtro retorna todos los pagos', () => {
      const { result } = renderHook(() => usePagosList(todosLosPagos));
      expect(result.current.filteredPagos).toHaveLength(3);
    });

    it('filtro "pagado" retorna solo los pagados', () => {
      const { result } = renderHook(() => usePagosList(todosLosPagos));
      act(() => result.current.setSelectedFilter('pagado'));
      expect(result.current.filteredPagos).toHaveLength(1);
      expect(result.current.filteredPagos[0].estaPagado).toBe(true);
    });

    it('filtro "vencido" retorna solo los vencidos', () => {
      const { result } = renderHook(() => usePagosList(todosLosPagos));
      act(() => result.current.setSelectedFilter('vencido'));
      expect(result.current.filteredPagos).toHaveLength(1);
      expect(result.current.filteredPagos[0].estaVencido).toBe(true);
    });

    it('filtro "parcial" retorna los pendientes (no pagados ni vencidos)', () => {
      const { result } = renderHook(() => usePagosList(todosLosPagos));
      act(() => result.current.setSelectedFilter('parcial'));
      expect(result.current.filteredPagos).toHaveLength(1);
      const p = result.current.filteredPagos[0];
      expect(p.estaPagado).toBe(false);
      expect(p.estaVencido).toBe(false);
    });

    it('busqueda por apellido (case insensitive) filtra correctamente', () => {
      const { result } = renderHook(() => usePagosList(todosLosPagos));
      act(() => result.current.setSearchQuery('garcia'));
      expect(result.current.filteredPagos).toHaveLength(1);
      expect(result.current.filteredPagos[0].titularApellido).toBe('Garcia');
    });

    it('busqueda que no coincide retorna lista vacia', () => {
      const { result } = renderHook(() => usePagosList(todosLosPagos));
      act(() => result.current.setSearchQuery('inexistente'));
      expect(result.current.filteredPagos).toHaveLength(0);
    });

    it('busqueda con espacios extra funciona correctamente', () => {
      const { result } = renderHook(() => usePagosList(todosLosPagos));
      act(() => result.current.setSearchQuery('  garcia  '));
      expect(result.current.filteredPagos).toHaveLength(1);
    });
  });

  describe('totals', () => {
    it('calcula totales de todos los pagos cuando no hay filtro', () => {
      const { result } = renderHook(() => usePagosList(todosLosPagos));
      expect(result.current.totals.generated).toBe(19000); // 5000+8000+6000
      expect(result.current.totals.paid).toBe(5000);
      expect(result.current.totals.balance).toBe(14000); // 8000+6000
    });

    it('recalcula totales al aplicar filtro', () => {
      const { result } = renderHook(() => usePagosList(todosLosPagos));
      act(() => result.current.setSelectedFilter('pagado'));
      expect(result.current.totals.generated).toBe(5000);
      expect(result.current.totals.paid).toBe(5000);
      expect(result.current.totals.balance).toBe(0);
    });

    it('retorna ceros cuando no hay pagos', () => {
      const { result } = renderHook(() => usePagosList([]));
      expect(result.current.totals.generated).toBe(0);
      expect(result.current.totals.paid).toBe(0);
      expect(result.current.totals.balance).toBe(0);
    });
  });

  describe('filterCounts', () => {
    it('cuenta correctamente por estado del array original (no del filtrado)', () => {
      const { result } = renderHook(() => usePagosList(todosLosPagos));
      act(() => result.current.setSelectedFilter('vencido')); // aplica filtro
      // Los counts siempre reflejan el array completo
      expect(result.current.filterCounts.all).toBe(3);
      expect(result.current.filterCounts.pagado).toBe(1);
      expect(result.current.filterCounts.vencido).toBe(1);
      expect(result.current.filterCounts.parcial).toBe(1);
    });

    it('retorna ceros para array vacio', () => {
      const { result } = renderHook(() => usePagosList([]));
      expect(result.current.filterCounts.all).toBe(0);
    });
  });

  describe('selectedInvoiceId', () => {
    it('inicia en null', () => {
      const { result } = renderHook(() => usePagosList(todosLosPagos));
      expect(result.current.selectedInvoiceId).toBeNull();
    });

    it('actualiza al llamar setSelectedInvoiceId', () => {
      const { result } = renderHook(() => usePagosList(todosLosPagos));
      act(() => result.current.setSelectedInvoiceId(42));
      expect(result.current.selectedInvoiceId).toBe(42);
    });
  });
});
