import { formatCurrency } from '../utils/currency.helpers';

interface EstadisticasMes {
  totalPagos: number;
  cantidadPagados: number;
  cantidadPendientes: number;
  cantidadVencidos: number;
  totalRecaudado: number;
  totalPendiente: number;
}

interface EstadisticasMesCardProps {
  estadisticas: EstadisticasMes;
}

export const EstadisticasMesCard = ({ estadisticas }: EstadisticasMesCardProps) => {
  return (
    <div className="rounded-3xl border border-[#e1e8ec] bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
        Estadísticas del Mes
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Pagos</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {estadisticas.totalPagos}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 mb-1">Pagados</p>
          <p className="text-2xl font-bold text-green-600">
            {estadisticas.cantidadPagados}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600">
            {estadisticas.cantidadPendientes}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 mb-1">Vencidos</p>
          <p className="text-2xl font-bold text-red-600">
            {estadisticas.cantidadVencidos}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Recaudado</p>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(estadisticas.totalRecaudado)}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Pendiente</p>
          <p className="text-xl font-bold text-red-600">
            {formatCurrency(estadisticas.totalPendiente)}
          </p>
        </div>
      </div>
    </div>
  );
};
