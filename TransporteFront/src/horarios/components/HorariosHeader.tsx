import { Button } from '../../shared/ui';

type HorariosHeaderProps = {
  title?: string;
  subtitle?: string;
  isGestionMode?: boolean;
  onGestionModeToggle?: () => void;
  mostrarInactivos?: boolean;
  onMostrarInactivosChange?: (valor: boolean) => void;
  onNuevoHorario?: () => void;
};

type MostrarInactivosToggleProps = {
  checked: boolean;
  onChange: (valor: boolean) => void;
};

const MostrarInactivosToggle = ({ checked, onChange }: MostrarInactivosToggleProps) => (
  <label htmlFor="mostrar-inactivos" className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
    <input
      id="mostrar-inactivos"
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4 rounded border-gray-300 accent-[#007a8a]"
    />
    Mostrar inactivos
  </label>
);

type GestionModeControlProps = {
  isGestionMode: boolean;
  onToggle: () => void;
};

const GestionModeControl = ({ isGestionMode, onToggle }: GestionModeControlProps) => {
  const indicatorClasses = isGestionMode
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-gray-200 bg-gray-100 text-gray-600';
  const indicatorIcon = isGestionMode ? 'edit' : 'visibility';
  const indicatorLabel = isGestionMode ? 'Modo gestión activo' : 'Modo vista';

  return (
    <>
      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${indicatorClasses}`}>
        <span className="material-symbols-outlined text-base">{indicatorIcon}</span>
        {indicatorLabel}
      </span>
      <Button variant={isGestionMode ? 'secondary' : 'brand'} size="sm" onClick={onToggle} className="w-full md:w-auto">
        {isGestionMode ? 'Salir de gestión' : 'Gestionar'}
      </Button>
    </>
  );
};

export const HorariosHeader = ({
  title = 'Horarios',
  subtitle = 'Visualiza la ocupación por horario y asigna pasajeros de forma masiva para equilibrar los recorridos.',
  isGestionMode = false,
  onGestionModeToggle,
  mostrarInactivos = false,
  onMostrarInactivosChange,
  onNuevoHorario,
}: HorariosHeaderProps) => {
  const hayAcciones = Boolean(onGestionModeToggle || onMostrarInactivosChange || onNuevoHorario);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#007a8a]">Operación diaria</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      {hayAcciones && (
        <div className="flex flex-col items-start gap-2 md:items-end">
          {onMostrarInactivosChange && <MostrarInactivosToggle checked={mostrarInactivos} onChange={onMostrarInactivosChange} />}
          {onNuevoHorario && (
            <Button variant="brand" size="sm" onClick={onNuevoHorario} className="w-full md:w-auto">
              Nuevo horario
            </Button>
          )}
          {onGestionModeToggle && <GestionModeControl isGestionMode={isGestionMode} onToggle={onGestionModeToggle} />}
        </div>
      )}
    </div>
  );
};
