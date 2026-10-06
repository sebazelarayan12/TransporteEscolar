import { describe, expect, it } from 'vitest';
import { horarioCrearFormSchema, horarioFormSchema } from '../horario.schema';

const valido = { hora: '8', descripcion: 'San Patricio', colegioId: 1, sentido: 'Ida', orden: 3 };

describe('horarioFormSchema', () => {
  it('acepta un horario completo', () => {
    expect(horarioFormSchema.safeParse(valido).success).toBe(true);
  });

  it.each(['8', '08', '8:15', '13:30', '0', '23:59'])('acepta la hora %s', (hora) => {
    expect(horarioFormSchema.safeParse({ ...valido, hora }).success).toBe(true);
  });

  it.each(['', '24', '8:60', '8:5', 'ocho', '8.30'])('rechaza la hora "%s"', (hora) => {
    expect(horarioFormSchema.safeParse({ ...valido, hora }).success).toBe(false);
  });

  it('rechaza una descripción vacía o de solo espacios', () => {
    expect(horarioFormSchema.safeParse({ ...valido, descripcion: '   ' }).success).toBe(false);
  });

  it('rechaza una etiqueta armada de más de 100 caracteres', () => {
    expect(horarioFormSchema.safeParse({ ...valido, descripcion: 'a'.repeat(100) }).success).toBe(false);
  });

  it('rechaza un colegio sin elegir', () => {
    expect(horarioFormSchema.safeParse({ ...valido, colegioId: 0 }).success).toBe(false);
  });

  it('rechaza un sentido distinto de Ida o Vuelta', () => {
    expect(horarioFormSchema.safeParse({ ...valido, sentido: 'Lateral' }).success).toBe(false);
  });

  it('rechaza un orden menor a 1', () => {
    expect(horarioFormSchema.safeParse({ ...valido, orden: 0 }).success).toBe(false);
  });

  it('convierte el orden escrito como texto', () => {
    const resultado = horarioFormSchema.safeParse({ ...valido, orden: '4' });
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.orden).toBe(4);
  });

  it('al editar rechaza un orden vacío', () => {
    expect(horarioFormSchema.safeParse({ ...valido, orden: '' }).success).toBe(false);
  });
});

describe('horarioCrearFormSchema', () => {
  it.each(['', null, undefined])('acepta el orden vacío (%s) y lo deja en null', (orden) => {
    const resultado = horarioCrearFormSchema.safeParse({ ...valido, orden });
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.orden).toBeNull();
  });

  it('convierte el orden escrito como texto', () => {
    const resultado = horarioCrearFormSchema.safeParse({ ...valido, orden: '7' });
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.orden).toBe(7);
  });

  it.each([0, -1, 1.5, 'abc'])('rechaza el orden %s', (orden) => {
    expect(horarioCrearFormSchema.safeParse({ ...valido, orden }).success).toBe(false);
  });

  it('mantiene las demás validaciones', () => {
    expect(horarioCrearFormSchema.safeParse({ ...valido, hora: '' }).success).toBe(false);
    expect(horarioCrearFormSchema.safeParse({ ...valido, descripcion: ' ' }).success).toBe(false);
    expect(horarioCrearFormSchema.safeParse({ ...valido, colegioId: 0 }).success).toBe(false);
    expect(horarioCrearFormSchema.safeParse({ ...valido, sentido: 'Lateral' }).success).toBe(false);
    expect(horarioCrearFormSchema.safeParse({ ...valido, descripcion: 'a'.repeat(100) }).success).toBe(false);
  });
});
