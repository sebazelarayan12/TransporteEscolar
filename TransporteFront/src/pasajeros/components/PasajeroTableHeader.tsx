export const PasajeroTableHeader = () => {
  return (
    <div className="grid grid-cols-8 gap-3 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      <span className="col-span-3">Pasajero</span>
      <span>Titular</span>
      <span>Colegio</span>
      <span>Curso</span>
      <span>Turno</span>
      <span>Estado</span>
    </div>
  );
};
