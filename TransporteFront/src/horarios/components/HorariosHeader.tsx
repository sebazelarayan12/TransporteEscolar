type HorariosHeaderProps = {
  title?: string;
  subtitle?: string;
};

export const HorariosHeader = ({
  title = 'Horarios',
  subtitle = 'Visualiza la ocupación por horario y asigna pasajeros de forma masiva para equilibrar los recorridos.',
}: HorariosHeaderProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#007a8a]">Operación diaria</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
};
