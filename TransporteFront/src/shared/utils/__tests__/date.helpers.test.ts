import { describe, it, expect } from 'vitest';
import { formatDateOnly, formatDateOnlyShort, formatDateOnlyCompact, formatDateTime } from '../date.helpers';

describe('formatDateOnly', () => {
  it('retorna string vacio para null', () => {
    expect(formatDateOnly(null)).toBe('');
  });

  it('retorna string vacio para undefined', () => {
    expect(formatDateOnly(undefined)).toBe('');
  });

  it('retorna string vacio para string vacio', () => {
    expect(formatDateOnly('')).toBe('');
  });

  it('retorna el input original para formato invalido', () => {
    expect(formatDateOnly('no-es-una-fecha')).toBe('no-es-una-fecha');
  });

  it('formatea fecha ISO valida con año, mes y dia', () => {
    const result = formatDateOnly('2026-02-11');
    expect(result).toContain('2026');
    expect(result).toContain('11');
    expect(result.length).toBeGreaterThan(0);
  });

  it('formatea fecha con timestamp T ignorando la hora', () => {
    const sinTimestamp = formatDateOnly('2026-02-11');
    const conTimestamp = formatDateOnly('2026-02-11T00:00:00');
    expect(sinTimestamp).toBe(conTimestamp);
  });

  it('acepta opciones de formato personalizadas', () => {
    const result = formatDateOnly('2026-02-11', { year: 'numeric' });
    expect(result).toContain('2026');
  });
});

describe('formatDateOnlyShort', () => {
  it('formatea fecha en formato dd/mm/yyyy', () => {
    const result = formatDateOnlyShort('2026-02-11');
    expect(result).toContain('11');
    expect(result).toContain('02');
    expect(result).toContain('2026');
  });

  it('retorna formato mas corto que el largo', () => {
    const corto = formatDateOnlyShort('2026-02-11');
    const largo = formatDateOnly('2026-02-11');
    expect(corto.length).toBeLessThan(largo.length);
  });
});

describe('formatDateOnlyCompact', () => {
  it('formatea fecha en formato compacto con año', () => {
    const result = formatDateOnlyCompact('2026-02-11');
    expect(result).toContain('2026');
    expect(result).toContain('11');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatDateTime', () => {
  it('retorna el input para string vacio', () => {
    expect(formatDateTime('')).toBe('');
  });

  it('retorna el input para ISO invalido', () => {
    expect(formatDateTime('no-es-fecha')).toBe('no-es-fecha');
  });

  it('formatea ISO valido con separador guion', () => {
    const result = formatDateTime('2026-02-11T14:30:00Z');
    expect(result).toContain(' - ');
    expect(result.length).toBeGreaterThan(0);
  });

  it('formatea ISO valido con año visible', () => {
    const result = formatDateTime('2026-02-11T14:30:00Z');
    expect(result).toContain('2026');
  });
});
