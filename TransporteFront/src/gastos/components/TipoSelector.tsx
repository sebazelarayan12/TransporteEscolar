interface TipoOption<T extends string> {
  value: T;
  icon: string;
}

interface TipoSelectorProps<T extends string> {
  title: string;
  isEditMode: boolean;
  editMessage: string;
  options: ReadonlyArray<TipoOption<T>>;
  selected: T;
  onSelect: (value: T) => void;
}

/**
 * Selector de tipo (fijo / variable) compartido por los formularios de gastos e ingresos.
 * En modo edición el tipo no se puede cambiar y se muestra un aviso en su lugar.
 */
export const TipoSelector = <T extends string>({
  title,
  isEditMode,
  editMessage,
  options,
  selected,
  onSelect,
}: TipoSelectorProps<T>) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">{title}</p>
    {isEditMode ? (
      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
        <span className="material-symbols-outlined text-[20px]">info</span>
        {editMessage}
      </div>
    ) : (
      <div className="mt-3 inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm dark:border-[#3f3f46] dark:bg-[#1f1f24]">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              selected === option.value
                ? 'bg-teal-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
            {option.value}
          </button>
        ))}
      </div>
    )}
  </div>
);
