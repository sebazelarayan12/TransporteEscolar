import { describe, it, expect } from 'vitest';
import { truncateNumberTowardZero, formatNumber } from '../number.helpers';

describe('truncateNumberTowardZero', () => {
  it('retorna el entero de un numero positivo con decimales', () => {
    expect(truncateNumberTowardZero(12.9)).toBe(12);
  });

  it('retorna el entero de un numero negativo con decimales (trunca hacia cero)', () => {
    expect(truncateNumberTowardZero(-12.9)).toBe(-12);
  });

  it('retorna el mismo valor si ya es entero', () => {
    expect(truncateNumberTowardZero(100)).toBe(100);
  });

  it('retorna 0 para 0', () => {
    expect(truncateNumberTowardZero(0)).toBe(0);
  });

  it('maneja decimales minimos como 0.9', () => {
    expect(truncateNumberTowardZero(0.9)).toBe(0);
  });
});

describe('formatNumber', () => {
  it('retorna string vacio para Infinity', () => {
    expect(formatNumber(Infinity)).toBe('');
  });

  it('retorna string vacio para NaN', () => {
    expect(formatNumber(NaN)).toBe('');
  });

  it('retorna string vacio para -Infinity', () => {
    expect(formatNumber(-Infinity)).toBe('');
  });

  it('formatea un numero entero en locale es-AR', () => {
    const result = formatNumber(1234);
    expect(result).toContain('1');
    expect(result).toContain('234');
  });

  it('trunca decimales antes de formatear', () => {
    const conDecimales = formatNumber(999.99);
    const sinDecimales = formatNumber(999);
    expect(conDecimales).toBe(sinDecimales);
  });

  it('formatea cero correctamente', () => {
    expect(formatNumber(0)).toBe('0');
  });
});
