import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSaldoPrioritario } from '../useSaldoPrioritario';
import type { PagoMensual } from '../../types/pago.types';
import { SALDO_PRIORITARIO_ESTADO } from '../../constants/saldo-estados.constants';

const crearPago = (overrides: Partial<PagoMensual>): PagoMensual => ({
  id: 1,
  titularId: 1,
  titularApellido: 'Garcia',
  titularNombre: 'Juan',
  titularDireccion: 'Dir 123',
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

describe('useSaldoPrioritario', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('sin deudas', () => {
    it('undefined retorna AL_DIA', () => {
      const { result } = renderHook(() => useSaldoPrioritario(undefined));
      expect(result.current.estado).toBe(SALDO_PRIORITARIO_ESTADO.AL_DIA);
      expect(result.current.cuotaPrioritaria).toBeNull();
      expect(result.current.label).toBe('Sin deuda activa');
    });

    it('array vacio retorna AL_DIA', () => {
      const { result } = renderHook(() => useSaldoPrioritario([]));
      expect(result.current.estado).toBe(SALDO_PRIORITARIO_ESTADO.AL_DIA);
    });

    it('todos los pagos saldados retorna AL_DIA', () => {
      const pagado = crearPago({ estaPagado: true, saldoPendiente: 0, totalPagado: 10000 });
      const { result } = renderHook(() => useSaldoPrioritario([pagado]));
      expect(result.current.estado).toBe(SALDO_PRIORITARIO_ESTADO.AL_DIA);
      expect(result.current.cuotasConDeuda).toHaveLength(0);
    });
  });

  describe('cuota de periodo pasado', () => {
    it('deuda de anio muy anterior retorna VENCIDO', () => {
      // Año 2020 siempre es pasado, sin necesidad de fake timers
      const pagoVencido = crearPago({ mes: 3, anio: 2020, saldoPendiente: 10000 });
      const { result } = renderHook(() => useSaldoPrioritario([pagoVencido]));
      expect(result.current.estado).toBe(SALDO_PRIORITARIO_ESTADO.VENCIDO);
    });
  });

  describe('cuota de proximo periodo', () => {
    it('cuota de anio muy futuro retorna PROXIMO_PERIODO', () => {
      // Año 2099 siempre es futuro, sin necesidad de fake timers
      const pagoFuturo = crearPago({ mes: 6, anio: 2099, saldoPendiente: 10000 });
      const { result } = renderHook(() => useSaldoPrioritario([pagoFuturo]));
      expect(result.current.estado).toBe(SALDO_PRIORITARIO_ESTADO.PROXIMO_PERIODO);
    });
  });

  describe('cuota del mes en curso', () => {
    it('dia 5 del mes (antes vencimiento dia 10) retorna MES_EN_CURSO', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 4, 5)); // 5 mayo 2026
      const pagoCorriente = crearPago({ mes: 5, anio: 2026, saldoPendiente: 10000 });
      const { result } = renderHook(() => useSaldoPrioritario([pagoCorriente]));
      expect(result.current.estado).toBe(SALDO_PRIORITARIO_ESTADO.MES_EN_CURSO);
    });

    it('dia 15 del mes (despues vencimiento dia 10) retorna VENCIDO', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 4, 15)); // 15 mayo 2026
      const pagoCorriente = crearPago({ mes: 5, anio: 2026, saldoPendiente: 10000 });
      const { result } = renderHook(() => useSaldoPrioritario([pagoCorriente]));
      expect(result.current.estado).toBe(SALDO_PRIORITARIO_ESTADO.VENCIDO);
    });
  });

  describe('cuotaPrioritaria', () => {
    it('prioriza cuota del mes actual sobre deuda anterior', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 4, 5)); // 5 mayo 2026
      const pagoAnterior = crearPago({ id: 1, mes: 3, anio: 2026, saldoPendiente: 5000 });
      const pagoCorriente = crearPago({ id: 2, mes: 5, anio: 2026, saldoPendiente: 8000 });
      const { result } = renderHook(() => useSaldoPrioritario([pagoAnterior, pagoCorriente]));
      expect(result.current.cuotaPrioritaria?.mes).toBe(5);
    });

    it('sin cuota del mes actual usa la deuda mas antigua', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 4, 5)); // 5 mayo 2026 — sin pago de mayo
      const pagoMar = crearPago({ id: 1, mes: 3, anio: 2026, saldoPendiente: 5000 });
      const pagoAbr = crearPago({ id: 2, mes: 4, anio: 2026, saldoPendiente: 8000 });
      const { result } = renderHook(() => useSaldoPrioritario([pagoAbr, pagoMar]));
      // Mas antigua = marzo (ordenadas por periodo)
      expect(result.current.cuotaPrioritaria?.mes).toBe(3);
    });
  });

  describe('cuotasConDeuda', () => {
    it('incluye solo pagos con saldoPendiente > 0', () => {
      const pagado = crearPago({ id: 1, saldoPendiente: 0, totalPagado: 10000 });
      const pendiente = crearPago({ id: 2, saldoPendiente: 5000, mes: 7 });
      const { result } = renderHook(() => useSaldoPrioritario([pagado, pendiente]));
      expect(result.current.cuotasConDeuda).toHaveLength(1);
      expect(result.current.cuotasConDeuda[0].id).toBe(2);
    });
  });

  describe('proximoVencimientoLabel', () => {
    it('retorna "Sin deudas activas" cuando no hay deuda', () => {
      const { result } = renderHook(() => useSaldoPrioritario([]));
      expect(result.current.proximoVencimientoLabel).toBe('Sin deudas activas');
    });

    it('retorna fecha formateada cuando hay deuda', () => {
      const pago = crearPago({ saldoPendiente: 10000, fechaVencimiento: '2026-06-10' });
      const { result } = renderHook(() => useSaldoPrioritario([pago]));
      expect(result.current.proximoVencimientoLabel).toContain('2026');
    });
  });
});
