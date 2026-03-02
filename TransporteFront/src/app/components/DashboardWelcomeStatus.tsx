interface DashboardWelcomeStatusProps {
  isSystemActive: boolean;
}

export const DashboardWelcomeStatus = ({ isSystemActive }: DashboardWelcomeStatusProps) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Resumen general</p>
      <h2 className="text-3xl font-bold text-[#0f181a] dark:text-white">Hola Estela y Esteban 👋</h2>
      <p className="text-sm text-gray-500">Conoce rápidamente el estado del servicio de transporte escolar.</p>
    </div>
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1 shadow-sm ${
        isSystemActive
          ? 'border-[#e1e8ec] bg-white dark:border-white/5 dark:bg-[#1f1f24]'
          : 'border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-900/20'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isSystemActive ? 'animate-pulse bg-emerald-500' : 'bg-rose-500'
        }`}
      />
      <span
        className={`text-xs font-semibold uppercase tracking-wide ${
          isSystemActive ? 'text-gray-600 dark:text-gray-300' : 'text-rose-600 dark:text-rose-400'
        }`}
      >
        {isSystemActive ? 'Sistema activo' : 'Sistema inactivo'}
      </span>
    </div>
  </div>
);
