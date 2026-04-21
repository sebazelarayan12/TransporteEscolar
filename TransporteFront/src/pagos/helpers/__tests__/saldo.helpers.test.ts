import { describe, it, expect } from 'vitest';
import { ordenarPagosPorPeriodo, filtrarCuotasConDeuda, obtenerProximoVencimiento } from '../saldo.helpers';
import type { PagoMensual } from '../../types/pago.types';

const crearPago = (mes: number, anio: number, saldoPendiente = 1000, overrides: Partial<PagoMensual> = {}): PagoMensual => ({
  id: mes * 100 + anio,
  titularId: 1,
  titularApellido: 'Garcia',
  titularNombre: 'Juan',
  titularDireccion: 'Dir',
  mes,
  anio,
  periodo: `${String(mes).padStart(2, '0')}/${anio}`,
  montoGenerado: 10000,
  totalPagado: 10000 - saldoPendiente,
  saldoPendiente,
  fechaVencimiento: `${anio}-${String(mes).padStart(2, '0')}-10T00:00:00Z`,
  estaPagado: saldoPendiente === 0,
  estaVencido: false,
  observaciones: null,
  movimientos: [],
  ...overrides,
});

describe('ordenarPagosPorPeriodo', () => {
  it('ordena por anio ascendente', () => {
    const pagos = [crearPago(6, 2025), crearPago(6, 2024)];
    const resultado = ordenarPagosPorPeriodo(pagos);
    expect(resultado[0].anio).toBe(2024);
    expect(resultado[1].anio).toBe(2025);
  });

  it('dentro del mismo anio ordena por mes ascendente', () => {
    const pagos = [crearPago(9, 2025), crearPago(3, 2025), crearPago(6, 2025)];
    const resultado = ordenarPagosPorPeriodo(pagos);
    expect(resultado.map((p) => p.mes)).toEqual([3, 6, 9]);
  });

  it('no muta el array original', () => {
    const pagos = [crearPago(9, 2025), crearPago(3, 2025)];
    const copia = [...pagos];
    ordenarPagosPorPeriodo(pagos);
    expect(pagos[0].mes).toBe(copia[0].mes);
  });

  it('retorna array vacio si recibe array vacio', () => {
    expect(ordenarPagosPorPeriodo([])).toEqual([]);
  });
});

describe('filtrarCuotasConDeuda', () => {
  it('retorna solo pagos con saldoPendiente mayor a 0', () => {
    const pagos = [
      crearPago(3, 2025, 5000),
      crearPago(4, 2025, 0),     // pagado
      crearPago(5, 2025, 2000),
    ];
    const resultado = filtrarCuotasConDeuda(pagos);
    expect(resultado).toHaveLength(2);
    expect(resultado.every((p) => p.saldoPendiente > 0)).toBe(true);
  });

  it('retorna array vacio si todos estan pagados', () => {
    const pagos = [crearPago(3, 2025, 0), crearPago(4, 2025, 0)];
    expect(filtrarCuotasConDeuda(pagos)).toHaveLength(0);
  });

  it('retorna todos si ninguno esta pagado', () => {
    const pagos = [crearPago(3, 2025, 1000), crearPago(4, 2025, 500)];
    expect(filtrarCuotasConDeuda(pagos)).toHaveLength(2);
  });
});

describe('obtenerProximoVencimiento', () => {
  it('retorna null para array vacio', () => {
    expect(obtenerProximoVencimiento([])).toBeNull();
  });

  it('retorna la fecha mas proxima entre varias cuotas con deuda', () => {
    const cuotas = [
      crearPago(3, 2025, 1000, { fechaVencimiento: '2025-03-10T00:00:00Z' }),
      crearPago(4, 2025, 1000, { fechaVencimiento: '2025-04-10T00:00:00Z' }),
      crearPago(5, 2025, 1000, { fechaVencimiento: '2025-05-10T00:00:00Z' }),
    ];
    expect(obtenerProximoVencimiento(cuotas)).toBe('2025-03-10T00:00:00Z');
  });

  it('retorna la unica fecha si hay una sola cuota', () => {
    const cuotas = [crearPago(6, 2025, 1000, { fechaVencimiento: '2025-06-10T00:00:00Z' })];
    expect(obtenerProximoVencimiento(cuotas)).toBe('2025-06-10T00:00:00Z');
  });
});
