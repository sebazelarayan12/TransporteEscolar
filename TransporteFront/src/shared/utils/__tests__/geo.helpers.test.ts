import { describe, expect, it } from 'vitest';
import {
  formatearCoordenada,
  formatearDistancia,
  formatearDuracion,
  formatearKilometros,
  TUCUMAN_CENTRO,
} from '../geo.helpers';

describe('geo.helpers', () => {
  describe('TUCUMAN_CENTRO', () => {
    it('apunta a Yerba Buena', () => {
      expect(TUCUMAN_CENTRO.lat).toBeCloseTo(-26.82, 1);
      expect(TUCUMAN_CENTRO.lng).toBeCloseTo(-65.29, 1);
    });
  });

  describe('formatearCoordenada', () => {
    it('recorta a seis decimales', () => {
      expect(formatearCoordenada(-26.81586081234)).toBe('-26.815861');
    });

    it('completa con ceros cuando faltan decimales', () => {
      expect(formatearCoordenada(-26.5)).toBe('-26.500000');
    });
  });

  describe('formatearDistancia', () => {
    it('muestra metros por debajo de mil', () => {
      expect(formatearDistancia(850)).toBe('850 m');
    });

    it('muestra kilometros con dos decimales por encima de mil', () => {
      expect(formatearDistancia(3061)).toBe('3,06 km');
    });

    it('trunca hacia cero en vez de redondear', () => {
      // 3069 m = 3,069 km -> 3,06 y no 3,07
      expect(formatearDistancia(3069)).toBe('3,06 km');
    });

    it('devuelve un guion cuando no hay dato', () => {
      expect(formatearDistancia(0)).toBe('—');
    });
  });

  describe('formatearKilometros', () => {
    it('trunca hacia cero en vez de redondear', () => {
      // 122,449 -> 122,44 y no 122,45; 3,069 -> 3,06 y no 3,07
      expect(formatearKilometros(122.449)).toBe('122,44 km');
      expect(formatearKilometros(3.069)).toBe('3,06 km');
    });

    it('usa coma decimal y el sufijo km', () => {
      expect(formatearKilometros(15)).toBe('15,00 km');
      expect(formatearKilometros(0.5)).toBe('0,50 km');
    });

    it('devuelve un guion cuando el valor es cero', () => {
      expect(formatearKilometros(0)).toBe('—');
    });

    it('devuelve un guion cuando el valor es negativo', () => {
      expect(formatearKilometros(-4.2)).toBe('—');
    });

    it('devuelve un guion cuando el valor no es un numero finito', () => {
      expect(formatearKilometros(Number.NaN)).toBe('—');
      expect(formatearKilometros(Number.POSITIVE_INFINITY)).toBe('—');
    });
  });

  describe('formatearDuracion', () => {
    it('muestra solo minutos por debajo de una hora', () => {
      expect(formatearDuracion(336)).toBe('5 min');
    });

    it('muestra horas y minutos por encima de una hora', () => {
      expect(formatearDuracion(4800)).toBe('1 h 20 min');
    });

    it('devuelve un guion cuando no hay dato', () => {
      expect(formatearDuracion(0)).toBe('—');
    });
  });
});
