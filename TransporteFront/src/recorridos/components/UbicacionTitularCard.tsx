import { useRef, useState } from 'react';
import { MapaUbicacion } from '../../shared/ui/MapaUbicacion';
import type { PuntoMapa } from '../../shared/ui/MapaUbicacion';
import { BuscadorDireccion } from './BuscadorDireccion';
import { RecorridosResumen } from './RecorridosResumen';
import { useToast } from '../../shared/hooks/useToast';
import { formatearCoordenada } from '../../shared/utils/geo.helpers';
import {
  useColegios,
  useGuardarUbicacion,
  useRecorridosTitular,
  useUbicacionTitular,
} from '../services/recorridos.queries';
import type { SugerenciaDireccion } from '../types/recorrido.types';

export interface UbicacionTitularCardProps {
  titularId: number;
  /** Dirección escrita del titular, para que el usuario la tenga a la vista al ubicar el pin. */
  direccionTexto: string;
}

/**
 * Ubicación de la casa del titular y kilómetros resultantes.
 *
 * El flujo es: buscar una dirección (opcional) → arrastrar el pin hasta la casa → guardar.
 * Al guardar, el backend recalcula los recorridos y la tabla se refresca sola.
 */
export const UbicacionTitularCard = ({ titularId, direccionTexto }: UbicacionTitularCardProps) => {
  const { data: ubicacion, isLoading: cargandoUbicacion, error } = useUbicacionTitular(titularId);
  const { data: recorridos = [], isLoading: cargandoRecorridos } = useRecorridosTitular(titularId);
  const { data: colegios = [] } = useColegios();
  const { mutateAsync: guardarUbicacion, isPending: guardando } = useGuardarUbicacion();
  const { showSuccess, showError } = useToast();

  const [puntoEditado, setPuntoEditado] = useState<PuntoMapa | null>(null);
  // Solo se leen al guardar y no cambian nada de lo que se dibuja, por eso no son estado.
  const direccionSugeridaRef = useRef<string | null>(null);
  const movidoAManoRef = useRef(false);

  const puntoGuardado: PuntoMapa | null = ubicacion
    ? { lat: ubicacion.latitud, lng: ubicacion.longitud }
    : null;

  const puntoActual = puntoEditado ?? puntoGuardado;
  const hayCambiosSinGuardar = puntoEditado !== null;

  const marcadoresColegios = colegios.map((colegio) => ({
    id: colegio.id,
    nombre: colegio.nombre,
    punto: { lat: colegio.latitud, lng: colegio.longitud },
  }));

  const seleccionarSugerencia = (sugerencia: SugerenciaDireccion) => {
    setPuntoEditado({ lat: sugerencia.latitud, lng: sugerencia.longitud });
    direccionSugeridaRef.current = sugerencia.etiqueta;
    movidoAManoRef.current = false;
  };

  const moverPin = (punto: PuntoMapa) => {
    setPuntoEditado(punto);
    movidoAManoRef.current = true;
  };

  const limpiarEdicion = () => {
    setPuntoEditado(null);
    direccionSugeridaRef.current = null;
    movidoAManoRef.current = false;
  };

  const guardar = async () => {
    if (!puntoEditado) {
      return;
    }

    try {
      await guardarUbicacion({
        titularId,
        data: {
          latitud: puntoEditado.lat,
          longitud: puntoEditado.lng,
          direccionNormalizada: direccionSugeridaRef.current,
          // Solo cuenta como manual si la persona movió el pin después de buscar.
          esManual: movidoAManoRef.current,
        },
      });

      limpiarEdicion();
      showSuccess('Ubicación guardada y kilómetros recalculados');
    } catch (errorGuardado) {
      console.error('Error al guardar la ubicación', errorGuardado);
      showError('No se pudo guardar la ubicación');
    }
  };

  if (error) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Ubicación y kilómetros</h2>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          No se pudo cargar la ubicación del titular.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Ubicación y kilómetros</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Dirección cargada: <span className="font-medium">{direccionTexto}</span>
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          El buscador solo propone una zona. Arrastrá el pin hasta la casa exacta antes de guardar.
        </p>
      </header>

      <BuscadorDireccion onSeleccionar={seleccionarSugerencia} disabled={guardando} />

      {cargandoUbicacion ? (
        <div className="h-80 w-full animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-700" />
      ) : (
        <MapaUbicacion
          valor={puntoActual}
          onChange={moverPin}
          marcadoresSecundarios={marcadoresColegios}
          soloLectura={guardando}
        />
      )}

      {puntoActual ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Coordenadas: {formatearCoordenada(puntoActual.lat)}, {formatearCoordenada(puntoActual.lng)}
        </p>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Todavía no hay una ubicación marcada. Buscá la dirección o hacé clic en el mapa.
        </p>
      )}

      {hayCambiosSinGuardar ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="rounded-lg bg-[#007a8a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00626e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? 'Guardando…' : 'Guardar ubicación'}
          </button>
          <button
            type="button"
            onClick={limpiarEdicion}
            disabled={guardando}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Descartar
          </button>
        </div>
      ) : null}

      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Recorridos calculados
        </h3>
        <RecorridosResumen recorridos={recorridos} isLoading={cargandoRecorridos} />
      </div>
    </section>
  );
};
