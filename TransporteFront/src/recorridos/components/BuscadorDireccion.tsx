import { useState } from 'react';
import { useBuscarDirecciones } from '../services/recorridos.queries';
import { useDebounce } from '../../shared/hooks/useDebounce';
import type { SugerenciaDireccion } from '../types/recorrido.types';

const RETRASO_BUSQUEDA_MS = 700;

export interface BuscadorDireccionProps {
  /** Se dispara al elegir una sugerencia de la lista. */
  onSeleccionar: (sugerencia: SugerenciaDireccion) => void;
  disabled?: boolean;
}

/**
 * Autocompletado de direcciones contra OpenStreetMap.
 *
 * Es una ayuda, no la fuente de verdad: después de elegir una sugerencia el usuario
 * tiene que arrastrar el pin hasta la casa exacta. La numeración de calles de la zona
 * está incompleta en el mapa base.
 *
 * El estado local es solo de UI (texto del input y etiqueta elegida). Los resultados
 * viven en el cache de TanStack Query.
 */
export const BuscadorDireccion = ({ onSeleccionar, disabled = false }: BuscadorDireccionProps) => {
  const [consulta, setConsulta] = useState('');
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const consultaRetrasada = useDebounce(consulta, RETRASO_BUSQUEDA_MS);

  // Una vez elegida una sugerencia, su etiqueta queda en el input: no se vuelve a buscar
  // para no gastar cuota de Nominatim.
  const { data: sugerencias = [], isFetching, isError } = useBuscarDirecciones(consultaRetrasada, {
    enabled: consultaRetrasada !== seleccionado,
  });

  const hayConsultaNueva = consulta !== seleccionado;

  const seleccionar = (sugerencia: SugerenciaDireccion) => {
    onSeleccionar(sugerencia);
    setConsulta(sugerencia.etiqueta);
    setSeleccionado(sugerencia.etiqueta);
  };

  const cambiarConsulta = (valor: string) => {
    setConsulta(valor);

    if (valor !== seleccionado) {
      setSeleccionado(null);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="buscador-direccion" className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
        Buscar dirección
      </label>

      <input
        id="buscador-direccion"
        type="text"
        value={consulta}
        onChange={(evento) => cambiarConsulta(evento.target.value)}
        disabled={disabled}
        placeholder="Av. Aconquija 1500, Yerba Buena"
        autoComplete="off"
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#007a8a] focus:outline-none focus:ring-1 focus:ring-[#007a8a] disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      />

      {isFetching ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Buscando…</p>
      ) : null}

      {!isFetching && hayConsultaNueva && sugerencias.length > 0 ? (
        <ul className="max-h-56 overflow-y-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
          {sugerencias.map((sugerencia) => (
            <li key={sugerencia.id}>
              <button
                type="button"
                onClick={() => seleccionar(sugerencia)}
                className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                {sugerencia.etiqueta}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!isFetching && isError && hayConsultaNueva ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          No se pudo buscar la dirección ahora. Podés ubicar el pin directamente en el mapa.
        </p>
      ) : null}

      {!isFetching && !isError && consultaRetrasada.trim().length >= 3 && hayConsultaNueva && sugerencias.length === 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Sin resultados. Podés ubicar el pin directamente en el mapa.
        </p>
      ) : null}
    </div>
  );
};
