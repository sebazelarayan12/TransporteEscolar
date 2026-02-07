interface MonthYearFilterProps {
  selectedMes: number | null;
  selectedAnio: number;
  onFilterChange: (mes: number, anio: number) => void;
}

const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

// Rango de años: desde 2024 hasta año actual + 1
const ANIOS = (() => {
  const currentYear = new Date().getFullYear();
  const startYear = 2024;
  const endYear = currentYear + 1;
  const years = [];
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }
  return years;
})();

export const MonthYearFilter = ({ selectedMes, selectedAnio, onFilterChange }: MonthYearFilterProps) => {
  const currentDate = new Date();
  const currentMes = currentDate.getMonth() + 1;
  const currentAnio = currentDate.getFullYear();

  const handleMesActual = () => {
    onFilterChange(currentMes, currentAnio);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Filtrar por mes/año:
      </label>
      
      <select
        value={selectedMes ?? ''}
        onChange={(e) => {
          const mes = parseInt(e.target.value);
          if (!isNaN(mes)) {
            onFilterChange(mes, selectedAnio);
          }
        }}
        className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#27272a] text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-[#1d8ca5] focus:outline-none transition-colors"
      >
        <option value="">Selecciona mes</option>
        {MESES.map((mes) => (
          <option key={mes.value} value={mes.value}>
            {mes.label}
          </option>
        ))}
      </select>

      <select
        value={selectedAnio}
        onChange={(e) => {
          const anio = parseInt(e.target.value);
          if (!isNaN(anio) && selectedMes) {
            onFilterChange(selectedMes, anio);
          }
        }}
        className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#27272a] text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-[#1d8ca5] focus:outline-none transition-colors"
      >
        {ANIOS.map((anio) => (
          <option key={anio} value={anio}>
            {anio}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleMesActual}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1d8ca5] text-white hover:bg-[#187286] transition-colors shadow-sm"
      >
        Mes Actual
      </button>
    </div>
  );
};
