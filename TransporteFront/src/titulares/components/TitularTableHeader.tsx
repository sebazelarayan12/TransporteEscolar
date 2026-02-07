export const TitularTableHeader = () => {
  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#e4e4e7] dark:border-[#3f3f46] bg-gray-50/50 dark:bg-white/[0.02] text-xs font-semibold text-gray-500 uppercase tracking-wider items-center sticky top-0 z-10">
      <div className="col-span-7 md:col-span-4 pl-2">Titular</div>
      <div className="col-span-5 md:col-span-3">Dirección</div>
      <div className="hidden md:block md:col-span-2 text-right pr-4">Monto Mensual</div>
      <div className="hidden md:block md:col-span-2">Estado</div>
      <div className="hidden md:block md:col-span-1 text-center">Acciones</div>
    </div>
  );
};
