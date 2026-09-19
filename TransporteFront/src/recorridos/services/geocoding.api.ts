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
 * @returns Sugerencias ordenadas por relevancia. Devuelve lista vacía ante cualquier error.
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

  try {
    const respuesta = await fetch(`${NOMINATIM_URL}?${parametros.toString()}`, { signal });

    if (!respuesta.ok) {
      return [];
    }

    const datos = respuestaSchema.safeParse(await respuesta.json());

    if (!datos.success) {
      return [];
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
  } catch (error) {
    // Una búsqueda cancelada es lo normal mientras alguien escribe: no es un error que reportar.
    if (error instanceof DOMException && error.name === 'AbortError') {
      return [];
    }

    console.error('Error al buscar direcciones', error);
    return [];
  }
};
