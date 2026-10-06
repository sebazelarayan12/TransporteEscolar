import { describe, expect, it } from 'vitest';
import { armarEtiqueta, dividirEtiqueta } from '../etiqueta.helpers';

describe('dividirEtiqueta', () => {
  it('separa la hora de la descripción', () => {
    expect(dividirEtiqueta('8 San Patricio')).toEqual({ hora: '8', descripcion: 'San Patricio' });
  });

  it('acepta horas con minutos', () => {
    expect(dividirEtiqueta('13:30 Boisdron Salida')).toEqual({ hora: '13:30', descripcion: 'Boisdron Salida' });
  });

  it('si no tiene el formato, deja la hora vacía y conserva todo el texto', () => {
    expect(dividirEtiqueta('San Patricio')).toEqual({ hora: '', descripcion: 'San Patricio' });
  });

  it('ignora espacios sobrantes', () => {
    expect(dividirEtiqueta('  9   Boisdron  ')).toEqual({ hora: '9', descripcion: 'Boisdron' });
  });
});

describe('armarEtiqueta', () => {
  it('une hora y descripción con un espacio', () => {
    expect(armarEtiqueta('8', 'San Patricio')).toBe('8 San Patricio');
  });

  it('recorta los espacios de ambos lados', () => {
    expect(armarEtiqueta(' 13:30 ', '  Boisdron Salida ')).toBe('13:30 Boisdron Salida');
  });

  it('es la inversa de dividirEtiqueta para etiquetas válidas', () => {
    const etiqueta = '17 Boisdron';
    const { hora, descripcion } = dividirEtiqueta(etiqueta);
    expect(armarEtiqueta(hora, descripcion)).toBe(etiqueta);
  });
});
