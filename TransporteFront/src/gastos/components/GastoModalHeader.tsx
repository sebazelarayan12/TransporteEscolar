interface GastoModalHeaderProps {
  periodLabel: string;
  mes: number;
  anio: number;
}

export const GastoModalHeader = ({ periodLabel, mes, anio }: GastoModalHeaderProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-200">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-teal-600">calendar_month</span>
        Periodo seleccionado: <span className="font-bold text-gray-900 dark:text-white">{periodLabel}</span>
      </div>
      <span className="text-xs uppercase tracking-widest text-teal-600">Mes {mes} / {anio}</span>
    </div>
  );
};
