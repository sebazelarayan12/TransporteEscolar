import { Button } from '../../shared/ui';
import { getTitularApellidoDisplay } from '../../shared/utils/titulares.helpers';
import type { ParadaFijaResponse } from '../../recorridos/types/recorrido.types';

interface ParadaFijaResumenProps {
  paradaFijaActual: ParadaFijaResponse | undefined;
  onIniciarEdicion: () => void;
  onQuitar: () => void;
  isQuitando: boolean;
}

/** Muestra la casa fija ya marcada (con acciones para cambiarla o quitarla), o el llamado a marcarla. */
export const ParadaFijaResumen = ({
  paradaFijaActual,
  onIniciarEdicion,
  onQuitar,
  isQuitando,
}: ParadaFijaResumenProps) => {
  if (!paradaFijaActual) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30">
        <p className="text-sm text-amber-900 dark:text-amber-100">
          Este viaje todavía no tiene casa fija marcada. Sin ella no se puede calcular el reparto de
          kilómetros.
        </p>
        <Button type="button" onClick={onIniciarEdicion} className="w-fit bg-[#007a8a] text-white hover:bg-[#00626e]">
          Marcar casa fija
        </Button>
      </div>
    );
  }

  if (!paradaFijaActual.sigueViajando) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/60 px-4 py-3 dark:border-red-800/50 dark:bg-red-900/10">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {getTitularApellidoDisplay(paradaFijaActual.titularApellido)}
          </p>
          <p className="text-xs text-red-600 dark:text-red-300">
            Esta familia ya no viaja en este horario. Reasigná la casa fija para poder calcular el
            reparto.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onIniciarEdicion}>
            Cambiar
          </Button>
          <button
            type="button"
            onClick={onQuitar}
            disabled={isQuitando}
            className="inline-flex items-center rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800/50 dark:text-red-300 dark:hover:bg-red-900/30"
          >
            {isQuitando ? 'Quitando...' : 'Quitar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-900/10">
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {getTitularApellidoDisplay(paradaFijaActual.titularApellido)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Casa fija marcada</p>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onIniciarEdicion}>
          Cambiar
        </Button>
        <button
          type="button"
          onClick={onQuitar}
          disabled={isQuitando}
          className="inline-flex items-center rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800/50 dark:text-red-300 dark:hover:bg-red-900/30"
        >
          {isQuitando ? 'Quitando...' : 'Quitar'}
        </button>
      </div>
    </div>
  );
};
