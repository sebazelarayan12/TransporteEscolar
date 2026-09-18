import { useGastosResumen } from '../services/gastos.queries';
import { useIngresosResumen } from '../services/ingresos.queries';
import { getErrorMessage } from '../helpers/gastos-page.helpers';

const GASTOS_ERROR = 'No pudimos obtener el resumen de gastos.';
const INGRESOS_ERROR = 'No pudimos obtener los ingresos externos.';

/**
 * Resumen mensual de gastos e ingresos externos para el periodo indicado,
 * con el estado combinado de carga y error.
 */
export const useGastosControlData = (mes: number, anio: number) => {
  const gastos = useGastosResumen(mes, anio);
  const ingresos = useIngresosResumen(mes, anio);

  const isInitialLoading = (gastos.isLoading && !gastos.data) || (ingresos.isLoading && !ingresos.data);

  let errorMessage: string | null = null;
  if (gastos.isError) errorMessage = getErrorMessage(gastos.error, GASTOS_ERROR);
  else if (ingresos.isError) errorMessage = getErrorMessage(ingresos.error, INGRESOS_ERROR);

  return {
    gastos: gastos.data,
    ingresos: ingresos.data,
    isInitialLoading,
    errorMessage,
    isFetching: gastos.isFetching,
    isIngresosFetching: ingresos.isFetching,
    refetchGastos: gastos.refetch,
    refetchIngresos: ingresos.refetch,
  };
};
