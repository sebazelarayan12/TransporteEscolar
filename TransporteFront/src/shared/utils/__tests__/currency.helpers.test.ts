import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrency } from '../currency.helpers';

describe('formatCurrency', () => {
  it('retorna string vacio para Infinity', () => {
    expect(formatCurrency(Infinity)).toBe('');
  });

  it('retorna string vacio para -Infinity', () => {
    expect(formatCurrency(-Infinity)).toBe('');
  });

  it('retorna string vacio para NaN', () => {
    expect(formatCurrency(NaN)).toBe('');
  });

  it('formatea un valor como pesos argentinos', () => {
    const result = formatCurrency(1000);
    expect(result).toContain('$');
    expect(result).toContain('1');
  });

  it('trunca decimales antes de formatear', () => {
    const conDecimales = formatCurrency(1500.99);
    const sinDecimales = formatCurrency(1500);
    expect(conDecimales).toBe(sinDecimales);
  });

  it('trunca hacia cero en negativos', () => {
    const conDecimales = formatCurrency(-1500.99);
    const sinDecimales = formatCurrency(-1500);
    expect(conDecimales).toBe(sinDecimales);
  });

  it('formatea cero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('$');
  });
});

describe('parseCurrency', () => {
  it('parsea un numero entero limpio', () => {
    expect(parseCurrency('1000')).toBe(1000);
  });

  it('elimina el simbolo de moneda y parsea el numero', () => {
    // parseCurrency remueve $ y espacios, parseFloat('1.234') = 1.234
    expect(parseCurrency('$ 1.234')).toBe(1.234);
  });

  it('maneja coma como separador decimal', () => {
    const result = parseCurrency('1500,50');
    expect(result).toBe(1500.5);
  });

  it('retorna NaN para string vacio', () => {
    expect(parseCurrency('')).toBeNaN();
  });
});
