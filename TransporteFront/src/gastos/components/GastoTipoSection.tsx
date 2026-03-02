import { GASTO_TIPOS, type GastoTipo } from '../types/gastos.types';

interface GastoTipoSectionProps {
  isEditMode: boolean;
  selectedTipo: GastoTipo;
  onSelectTipo: (tipo: GastoTipo) => void;
}

export const GastoTipoSection = ({ isEditMode, selectedTipo, onSelectTipo }: GastoTipoSectionProps) => {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">Tipo de gasto</p>
      {isEditMode ? (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          <span className="material-symbols-outlined text-[20px]">info</span>
          Editás la plantilla del gasto fijo seleccionado. Los cambios impactan en este mes y los próximos.
        </div>
      ) : (
        <div className="mt-3 inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm dark:border-[#3f3f46] dark:bg-[#1f1f24]">
          {([GASTO_TIPOS.VARIABLE, GASTO_TIPOS.FIJO] as const).map((tipo) => {
            const isActive = selectedTipo === tipo;
            const icon = tipo === GASTO_TIPOS.VARIABLE ? 'dynamic_form' : 'deployed_code';
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => {
                  onSelectTipo(tipo);
                }}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
                {tipo}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
