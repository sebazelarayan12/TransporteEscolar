import { Button } from '../../shared/ui';

type HorariosHeaderProps = {
  title?: string;
  subtitle?: string;
  isGestionMode?: boolean;
  onGestionModeToggle?: () => void;
};

export const HorariosHeader = ({
  title = 'Horarios',
  subtitle = 'Visualiza la ocupación por horario y asigna pasajeros de forma masiva para equilibrar los recorridos.',
  isGestionMode = false,
  onGestionModeToggle,
}: HorariosHeaderProps) => {
  const indicatorClasses = isGestionMode
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-gray-200 bg-gray-100 text-gray-600';
  const indicatorIcon = isGestionMode ? 'edit' : 'visibility';
  const indicatorLabel = isGestionMode ? 'Modo gestión activo' : 'Modo vista';

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#007a8a]">Operación diaria</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      {onGestionModeToggle ? (
        <div className="flex flex-col items-start gap-2 md:items-end">
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${indicatorClasses}`}>
            <span className="material-symbols-outlined text-base">{indicatorIcon}</span>
            {indicatorLabel}
          </span>
          <Button
            variant={isGestionMode ? 'secondary' : 'brand'}
            size="sm"
            onClick={onGestionModeToggle}
            className="w-full md:w-auto"
          >
            {isGestionMode ? 'Salir de gestión' : 'Gestionar'}
          </Button>
        </div>
      ) : null}
    </div>
  );
};
