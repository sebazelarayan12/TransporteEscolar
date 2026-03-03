import { Button } from '../../shared/ui';
import { getHorarioEtiquetaDisplay } from '../helpers/horario.helpers';

type HorarioOption = {
  value: number;
  label: string;
};

type HorarioSelectValue = number | '';

interface PasajeroHorariosSectionProps {
  horarioSelectId: string;
  horarioHintId: string;
  horarioToAdd: HorarioSelectValue;
  selectableHorarios: HorarioOption[];
  selectedHorarios: HorarioOption[];
  principalHorarioId: number | null;
  canAddHorario: boolean;
  isSaving: boolean;
  isLoadingHorarios: boolean;
  isAssigningHorarios: boolean;
  onHorarioChange: (value: HorarioSelectValue) => void;
  onAgregarHorario: () => void;
  onSeleccionarPrincipal: (horarioId: number) => void;
  onEliminarHorario: (horarioId: number) => void;
}

export const PasajeroHorariosSection = ({
  horarioSelectId,
  horarioHintId,
  horarioToAdd,
  selectableHorarios,
  selectedHorarios,
  principalHorarioId,
  canAddHorario,
  isSaving,
  isLoadingHorarios,
  isAssigningHorarios,
  onHorarioChange,
  onAgregarHorario,
  onSeleccionarPrincipal,
  onEliminarHorario,
}: PasajeroHorariosSectionProps) => {
  return (
    <section className="space-y-3">
      <div>
        <label htmlFor={horarioSelectId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Horarios del pasajero
        </label>
        <p id={horarioHintId} className="text-xs text-gray-500 dark:text-gray-400">
          Agrega uno o varios horarios y marca cuál será el principal.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          id={horarioSelectId}
          value={horarioToAdd === '' ? '' : horarioToAdd}
          onChange={(event) => {
            const rawValue = event.target.value;
            onHorarioChange(rawValue ? Number(rawValue) : '');
          }}
          disabled={isSaving || isLoadingHorarios || !selectableHorarios.length}
          aria-describedby={horarioHintId}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007a8a] dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white"
        >
          <option value="">
            {selectableHorarios.length ? 'Seleccioná un horario' : 'No hay más horarios disponibles'}
          </option>
          {selectableHorarios.map((option) => (
            <option key={option.value} value={option.value}>
              {getHorarioEtiquetaDisplay(option.label)}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="secondary"
          onClick={onAgregarHorario}
          disabled={!canAddHorario || isSaving || isLoadingHorarios}
          className="w-full sm:w-auto"
        >
          Agregar horario
        </Button>
      </div>
      <div className="rounded-2xl border border-dashed border-gray-200 p-4 dark:border-white/10">
        {selectedHorarios.length ? (
          <div className="space-y-3">
            {selectedHorarios.map((horario) => (
              <div
                key={horario.value}
                className={`flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm transition dark:border-white/10 sm:flex-row sm:items-center sm:justify-between ${
                  horario.value === principalHorarioId
                    ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-900/10'
                    : 'border-gray-200'
                }`}
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white" title={horario.label}>
                    {horario.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {horario.value === principalHorarioId ? 'Horario principal' : 'Horario secundario'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSeleccionarPrincipal(horario.value)}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      horario.value === principalHorarioId
                        ? 'border-emerald-400 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100'
                        : 'border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600 dark:border-white/10 dark:text-gray-400'
                    }`}
                    disabled={horario.value === principalHorarioId}
                  >
                    Principal
                  </button>
                  <button
                    type="button"
                    onClick={() => onEliminarHorario(horario.value)}
                    className="inline-flex items-center rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-800/50 dark:text-red-300 dark:hover:bg-red-900/30"
                    disabled={isAssigningHorarios}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sin horarios asignados. Podés agregarlos ahora o desde el módulo de Horarios.
          </p>
        )}
      </div>
    </section>
  );
};
