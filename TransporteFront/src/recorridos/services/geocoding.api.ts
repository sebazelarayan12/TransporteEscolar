import { z } from 'zod';
import type { SugerenciaDireccion } from '../types/recorrido.types';

/**
 * Nominatim, el buscador de OpenStreetMap. No pasa por `apiClient` porque es un
 * servicio externo, no nuestro backend.
 *
 * Límites de uso que hay que respetar (política oficial de la OSMF):
 * - máximo un pedido por segundo: por eso las llamadas van con debounce,
 * - los resultados se cachean del lado del cliente,
 * - la geocodificación no es la función principal de la app, solo sugiere.
 *
 * La numeración de calles en Yerba Buena está incompleta en OpenStreetMap:
 * este buscador propone una zona, y el usuario termina de ubicar el pin a mano.
 */
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/** Recuadro de búsqueda: Gran San Miguel de Tucumán y Yerba Buena. Formato lon,lat,lon,lat. */
const VIEWBOX_TUCUMAN = '-65.45,-26.70,-65.15,-26.95';

const LIMITE_RESULTADOS = 6;

const resultadoSchema = z.object({
  place_id: z.union([z.number(), z.string()]),
  display_name: z.string(),
  lat: z.string(),
  lon: z.string(),
});

const respuestaSchema = z.array(resultadoSchema);

/**
 * Busca direcciones en la zona de cobertura.
 *
 * @param consulta Texto libre. Si tiene menos de 3 caracteres devuelve una lista vacía sin consultar.
 * @param signal Señal para cancelar la consulta cuando el usuario sigue escribiendo.
 * @returns Sugerencias ordenadas por relevancia. Una lista vacía significa "sin resultados".
 * @throws Error si Nominatim responde con error o con un formato inesperado, o si falla la red.
 */
export const buscarDirecciones = async (
  consulta: string,
  signal?: AbortSignal,
): Promise<SugerenciaDireccion[]> => {
  const texto = consulta.trim();

  if (texto.length < 3) {
    return [];
  }

  const parametros = new URLSearchParams({
    q: texto,
    format: 'jsonv2',
    limit: String(LIMITE_RESULTADOS),
    countrycodes: 'ar',
    viewbox: VIEWBOX_TUCUMAN,
    bounded: '1',
    'accept-language': 'es',
  });

  // Los errores se propagan a propósito: esta función corre dentro de TanStack Query, y un
  // fallo devuelto como lista vacía se cachearía como "sin resultados" válido durante 24 horas.
  // Una búsqueda cancelada (AbortError) también propaga: TanStack la maneja solo.
  const respuesta = await fetch(`${NOMINATIM_URL}?${parametros.toString()}`, { signal });

  if (!respuesta.ok) {
    throw new Error(`Nominatim respondió ${respuesta.status}`);
  }

  const datos = respuestaSchema.safeParse(await respuesta.json());

  if (!datos.success) {
    throw new Error('Nominatim devolvió una respuesta con un formato inesperado');
  }

  return datos.data
    .map((resultado) => ({
      id: String(resultado.place_id),
      etiqueta: resultado.display_name,
      latitud: Number.parseFloat(resultado.lat),
      longitud: Number.parseFloat(resultado.lon),
    }))
    .filter(
      (sugerencia) => Number.isFinite(sugerencia.latitud) && Number.isFinite(sugerencia.longitud),
    );
};
