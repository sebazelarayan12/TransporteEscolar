import { describe, expect, it } from 'vitest';
import { loginFormSchema } from '../login.schema';

describe('loginFormSchema', () => {
  it('acepta usuario y contraseña', () => {
    expect(loginFormSchema.safeParse({ usuario: 'admin', password: 'x' }).success).toBe(true);
  });

  it('rechaza usuario y contraseña vacíos con mensajes en español', () => {
    const resultado = loginFormSchema.safeParse({ usuario: '   ', password: '' });

    expect(resultado.success).toBe(false);
    const mensajes = resultado.error?.issues.map((issue) => issue.message);
    expect(mensajes).toEqual(['Ingresá tu usuario', 'Ingresá tu contraseña']);
  });
});
