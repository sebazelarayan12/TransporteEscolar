import { describe, expect, it } from 'vitest';
import { construirFilasRecorrido } from '../recorrido-viaje.helpers';
import { SENTIDOS_HORARIO } from '../../types/recorrido.types';
import type { RecorridoViajeResponse } from '../../types/recorrido.types';

const baseRecorrido: RecorridoViajeResponse = {
  horarioId: 1,
  horarioEtiqueta: '08:00',
  sentido: SENTIDOS_HORARIO.IDA,
  transporte: 1,
  colegioNombre: 'Colegio Test',
  distanciaTotalMetros: 5000,
  duracionTotalSegundos: 600,
  metrosTramoFinal: 800,
  fechaCalculo: '2026-09-18T00:00:00Z',
  paradas: [
    {
      orden: 1,
      titularId: 10,
      apellido: 'Gomez',
      metrosTramoAnterior: 0,
      metrosAsignados: 1200,
      esParadaFija: true,
    },
    {
      orden: 2,
      titularId: 11,
      apellido: 'Perez',
      metrosTramoAnterior: 4200,
      metrosAsignados: 3000,
      esParadaFija: false,
    },
  ],
};

describe('construirFilasRecorrido', () => {
  it('en ida agrega el colegio al final, con el tramo desde la última parada', () => {
    const filas = construirFilasRecorrido(baseRecorrido);

    expect(filas).toHaveLength(3);
    expect(filas[0].nombre).toBe('Gomez');
    expect(filas[1].nombre).toBe('Perez');

    const filaColegio = filas[2];
    expect(filaColegio.esColegio).toBe(true);
    expect(filaColegio.nombre).toBe('Colegio Test');
    expect(filaColegio.metrosTramoAnterior).toBe(800);
    expect(filaColegio.metrosAsignados).toBe(0);
  });

  it('en ida etiqueta la parada fija como "primera parada"', () => {
    const filas = construirFilasRecorrido(baseRecorrido);
    expect(filas[0].etiquetaParadaFija).toBe('primera parada');
    expect(filas[1].etiquetaParadaFija).toBeNull();
  });

  it('en vuelta agrega el colegio al principio, sin tramo anterior propio', () => {
    const recorridoVuelta: RecorridoViajeResponse = {
      ...baseRecorrido,
      sentido: SENTIDOS_HORARIO.VUELTA,
      metrosTramoFinal: 0,
      paradas: [
        { ...baseRecorrido.paradas[0], metrosTramoAnterior: 900 },
        { ...baseRecorrido.paradas[1] },
      ],
    };

    const filas = construirFilasRecorrido(recorridoVuelta);

    expect(filas).toHaveLength(3);
    const filaColegio = filas[0];
    expect(filaColegio.esColegio).toBe(true);
    // El colegio es el punto de partida: no repite el tramo que ya está en la primera parada.
    expect(filaColegio.metrosTramoAnterior).toBe(0);

    // El tramo desde el colegio aparece una sola vez, en la primera parada real.
    expect(filas[1].nombre).toBe('Gomez');
    expect(filas[1].metrosTramoAnterior).toBe(900);
  });

  it('en vuelta etiqueta la parada fija como "última parada"', () => {
    const recorridoVuelta: RecorridoViajeResponse = {
      ...baseRecorrido,
      sentido: SENTIDOS_HORARIO.VUELTA,
      metrosTramoFinal: 0,
    };

    const filas = construirFilasRecorrido(recorridoVuelta);
    const filaFija = filas.find((fila) => fila.etiquetaParadaFija !== null);
    expect(filaFija?.nombre).toBe('Gomez');
    expect(filaFija?.etiquetaParadaFija).toBe('última parada');
  });
});
