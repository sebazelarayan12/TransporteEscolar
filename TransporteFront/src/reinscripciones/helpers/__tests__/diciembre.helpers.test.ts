import { describe, it, expect } from 'vitest';
import {
  buildConfirmarDiciembreRequest,
  buildResumenDiciembre,
  getDiciembreEstadoLabel,
  montoInicialDiciembre,
  puedeMarcarNoVa,
} from '../diciembre.helpers';
import { DICIEMBRE_ESTADOS, type DiciembreTitularItem } from '../../types/diciembre.types';

const crearTitular = (overrides: Partial<DiciembreTitularItem> = {}): DiciembreTitularItem => ({
  titularId: 1,
  apellido: 'PEREZ',
  nombreContacto: 'Ana',
  pasajeros: ['Juan'],
  estado: DICIEMBRE_ESTADOS.PENDIENTE,
  montoPactado: 120000,
  montoDiciembre: null,
  pagoMensualId: null,
  totalPagado: 0,
  cuotaPreexistente: false,
  ...overrides,
});

describe('buildResumenDiciembre', () => {
  it('retorna ceros para lista vacia', () => {
    expect(buildResumenDiciembre([])).toEqual({ pendientes: 0, van: 0, noVan: 0, totalEsperado: 0 });
  });

  it('cuenta pendientes, van y no van', () => {
    const titulares = [
      crearTitular({ titularId: 1, estado: DICIEMBRE_ESTADOS.PENDIENTE }),
      crearTitular({ titularId: 2, estado: DICIEMBRE_ESTADOS.VA, montoDiciembre: 60000 }),
      crearTitular({ titularId: 3, estado: DICIEMBRE_ESTADOS.NO_VA }),
      crearTitular({ titularId: 4, estado: DICIEMBRE_ESTADOS.VA, montoDiciembre: 40000 }),
    ];

    const resumen = buildResumenDiciembre(titulares);

    expect(resumen.pendientes).toBe(1);
    expect(resumen.van).toBe(2);
    expect(resumen.noVan).toBe(1);
  });

  it('el total esperado suma solo el montoDiciembre de los que van', () => {
    const titulares = [
      crearTitular({ titularId: 1, estado: DICIEMBRE_ESTADOS.VA, montoDiciembre: 60000 }),
      crearTitular({ titularId: 2, estado: DICIEMBRE_ESTADOS.VA, montoDiciembre: 40000 }),
      crearTitular({ titularId: 3, estado: DICIEMBRE_ESTADOS.NO_VA, montoDiciembre: null }),
      crearTitular({ titularId: 4, estado: DICIEMBRE_ESTADOS.PENDIENTE, montoPactado: 999999 }),
    ];

    expect(buildResumenDiciembre(titulares).totalEsperado).toBe(100000);
  });
});

describe('puedeMarcarNoVa', () => {
  it('permite no va cuando la cuota no tiene pagos', () => {
    expect(puedeMarcarNoVa(crearTitular({ totalPagado: 0 }))).toBe(true);
  });

  it('no permite no va cuando la cuota ya tiene pagos', () => {
    expect(puedeMarcarNoVa(crearTitular({ totalPagado: 5000 }))).toBe(false);
  });
});

describe('montoInicialDiciembre', () => {
  it('usa el montoPactado cuando todavia no hay cuota de diciembre', () => {
    expect(montoInicialDiciembre(crearTitular({ montoPactado: 120000, montoDiciembre: null }))).toBe(120000);
  });

  it('usa el montoDiciembre existente cuando ya hay cuota', () => {
    expect(montoInicialDiciembre(crearTitular({ montoPactado: 120000, montoDiciembre: 60000 }))).toBe(60000);
  });
});

describe('buildConfirmarDiciembreRequest', () => {
  it('para va envia el monto truncado hacia cero', () => {
    expect(buildConfirmarDiciembreRequest(2026, 'va', 60000.9)).toEqual({ anio: 2026, va: true, monto: 60000 });
  });

  it('para no va envia monto null aunque haya un valor cargado', () => {
    expect(buildConfirmarDiciembreRequest(2026, 'noVa', 60000)).toEqual({ anio: 2026, va: false, monto: null });
  });
});

describe('getDiciembreEstadoLabel', () => {
  it('muestra "No va" para el estado NoVa', () => {
    expect(getDiciembreEstadoLabel(DICIEMBRE_ESTADOS.NO_VA)).toBe('No va');
  });

  it('muestra "Va" y "Pendiente" tal cual', () => {
    expect(getDiciembreEstadoLabel(DICIEMBRE_ESTADOS.VA)).toBe('Va');
    expect(getDiciembreEstadoLabel(DICIEMBRE_ESTADOS.PENDIENTE)).toBe('Pendiente');
  });
});
