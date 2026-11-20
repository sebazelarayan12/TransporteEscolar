import { describe, it, expect } from 'vitest';
import { diciembreFormSchema } from '../diciembre.schema';
import { DICIEMBRE_MONTO_MAXIMO } from '../../helpers/diciembre.helpers';

describe('diciembreFormSchema', () => {
  it('exige elegir una decisión', () => {
    const result = diciembreFormSchema.safeParse({ decision: undefined, monto: undefined });
    expect(result.success).toBe(false);
  });

  it('acepta "no va" sin monto', () => {
    const result = diciembreFormSchema.safeParse({ decision: 'noVa', monto: undefined });
    expect(result.success).toBe(true);
  });

  it('acepta "no va" aunque el monto tenga un valor (se ignora)', () => {
    const result = diciembreFormSchema.safeParse({ decision: 'noVa', monto: 0 });
    expect(result.success).toBe(true);
  });

  it('"va" exige monto', () => {
    const result = diciembreFormSchema.safeParse({ decision: 'va', monto: undefined });
    expect(result.success).toBe(false);
  });

  it('"va" rechaza monto cero o negativo', () => {
    expect(diciembreFormSchema.safeParse({ decision: 'va', monto: 0 }).success).toBe(false);
    expect(diciembreFormSchema.safeParse({ decision: 'va', monto: -10 }).success).toBe(false);
  });

  it('"va" rechaza montos por encima del maximo', () => {
    const result = diciembreFormSchema.safeParse({ decision: 'va', monto: DICIEMBRE_MONTO_MAXIMO + 1 });
    expect(result.success).toBe(false);
  });

  it('"va" acepta un monto valido', () => {
    const result = diciembreFormSchema.safeParse({ decision: 'va', monto: 60000 });
    expect(result.success).toBe(true);
  });
});
