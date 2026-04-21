import { describe, it, expect, vi, afterEach } from 'vitest';
import { getPagoEstado, esCicloActual, agruparPorPeriodo } from '../periodo.helpers';
import type { PagoMensual } from '../../types/pago.types';

const crearPago = (overrides: Partial<PagoMensual> = {}): PagoMensual => ({
  id: 1,
  titularId: 1,
  titularApellido: 'Garcia',
  titularNombre: 'Juan',
  titularDireccion: 'Dir 1',
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

describe('getPagoEstado', () => {
  it('retorna "pagado" cuando estaPagado es true', () => {
    const pago = crearPago({ estaPagado: true, estaVencido: false });
    expect(getPagoEstado(pago)).toBe('pagado');
  });

  it('retorna "vencido" cuando estaVencido es true y no esta pagado', () => {
    const pago = crearPago({ estaPagado: false, estaVencido: true });
    expect(getPagoEstado(pago)).toBe('vencido');
  });

  it('retorna "pendiente" cuando no esta pagado ni vencido', () => {
    const pago = crearPago({ estaPagado: false, estaVencido: false });
    expect(getPagoEstado(pago)).toBe('pendiente');
  });
});

describe('esCicloActual', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('en octubre 2024: marzo 2024 es ciclo actual', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 9, 15)); // octubre 2024
    expect(esCicloActual(3, 2024)).toBe(true);
  });

  it('en octubre 2024: diciembre 2024 es ciclo actual', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 9, 15));
    expect(esCicloActual(12, 2024)).toBe(true);
  });

  it('en octubre 2024: enero 2025 es ciclo actual (extension)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 9, 15));
    expect(esCicloActual(1, 2025)).toBe(true);
  });

  it('en octubre 2024: febrero 2025 es ciclo actual (extension)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 9, 15));
    expect(esCicloActual(2, 2025)).toBe(true);
  });

  it('en octubre 2024: marzo 2025 es historico (futuro)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 9, 15));
    expect(esCicloActual(3, 2025)).toBe(false);
  });

  it('en octubre 2024: diciembre 2023 es historico (ciclo anterior)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 9, 15));
    expect(esCicloActual(12, 2023)).toBe(false);
  });

  it('en enero 2025: el ciclo actual es el 2024', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15)); // enero 2025
    expect(esCicloActual(3, 2024)).toBe(true);
    expect(esCicloActual(12, 2024)).toBe(true);
    expect(esCicloActual(1, 2025)).toBe(true);
    expect(esCicloActual(3, 2025)).toBe(false); // futuro
  });
});

describe('agruparPorPeriodo', () => {
  it('retorna lista vacia para array vacio', () => {
    expect(agruparPorPeriodo([])).toEqual([]);
  });

  it('agrupa pagos del mismo mes/anio en un grupo', () => {
    const pagos = [
      crearPago({ id: 1, titularId: 1, mes: 6, anio: 2025 }),
      crearPago({ id: 2, titularId: 2, mes: 6, anio: 2025 }),
    ];
    const grupos = agruparPorPeriodo(pagos);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].pagos).toHaveLength(2);
  });

  it('crea grupos separados por mes', () => {
    const pagos = [
      crearPago({ id: 1, mes: 6, anio: 2025 }),
      crearPago({ id: 2, mes: 7, anio: 2025 }),
    ];
    const grupos = agruparPorPeriodo(pagos);
    expect(grupos).toHaveLength(2);
  });

  it('ordena grupos con el mas reciente primero', () => {
    const pagos = [
      crearPago({ id: 1, mes: 3, anio: 2025 }),
      crearPago({ id: 2, mes: 6, anio: 2025 }),
      crearPago({ id: 3, mes: 1, anio: 2025 }),
    ];
    const grupos = agruparPorPeriodo(pagos);
    const meses = grupos.map((g) => Number(g.id.split('-')[0]));
    expect(meses).toEqual([6, 3, 1]); // descendente
  });

  it('ordena por anio descendente primero', () => {
    const pagos = [
      crearPago({ id: 1, mes: 6, anio: 2024 }),
      crearPago({ id: 2, mes: 6, anio: 2025 }),
    ];
    const grupos = agruparPorPeriodo(pagos);
    const anios = grupos.map((g) => Number(g.id.split('-')[1]));
    expect(anios).toEqual([2025, 2024]);
  });
});
