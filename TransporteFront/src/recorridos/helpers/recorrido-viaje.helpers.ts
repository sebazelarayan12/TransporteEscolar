import { SENTIDOS_HORARIO } from '../types/recorrido.types';
import type { RecorridoViajeResponse } from '../types/recorrido.types';

/** Una fila de la tabla del recorrido: una parada o el colegio. */
export interface FilaRecorrido {
  key: string;
  esColegio: boolean;
  /** Texto del número de orden, o "Colegio" cuando la fila es el colegio. */
  ordenLabel: string;
  nombre: string;
  /** Metros desde el punto anterior del recorrido (0 cuando no aplica: es el punto de partida). */
  metrosTramoAnterior: number;
  /** Metros del viaje asignados a esa familia (0 en la fila del colegio: no es una familia). */
  metrosAsignados: number;
  etiquetaParadaFija: string | null;
}

/**
 * Arma las filas a mostrar, en el orden real en que se maneja el vehículo: el colegio se intercala
 * como una fila más, al final en los viajes de ida y al principio en los de vuelta.
 *
 * En vuelta, el tramo del colegio a la primera parada ya viene en `metrosTramoAnterior` de esa
 * parada (así lo persiste el backend): la fila del colegio no repite ese dato, es el punto de
 * partida y no tiene tramo anterior propio.
 */
export const construirFilasRecorrido = (recorrido: RecorridoViajeResponse): FilaRecorrido[] => {
  const esIda = recorrido.sentido === SENTIDOS_HORARIO.IDA;

  const filasParadas: FilaRecorrido[] = recorrido.paradas.map((parada) => ({
    key: `parada-${parada.titularId}`,
    esColegio: false,
    ordenLabel: String(parada.orden),
    nombre: parada.apellido,
    metrosTramoAnterior: parada.metrosTramoAnterior,
    metrosAsignados: parada.metrosAsignados,
    etiquetaParadaFija: parada.esParadaFija ? (esIda ? 'primera parada' : 'última parada') : null,
  }));

  const filaColegio: FilaRecorrido = {
    key: 'colegio',
    esColegio: true,
    ordenLabel: 'Colegio',
    nombre: recorrido.colegioNombre,
    // En ida, el colegio cierra el recorrido: su tramo es la distancia desde la última parada.
    // En vuelta, el colegio es el punto de partida: no tiene tramo anterior propio.
    metrosTramoAnterior: esIda ? recorrido.metrosTramoFinal : 0,
    metrosAsignados: 0,
    etiquetaParadaFija: null,
  };

  return esIda ? [...filasParadas, filaColegio] : [filaColegio, ...filasParadas];
};
