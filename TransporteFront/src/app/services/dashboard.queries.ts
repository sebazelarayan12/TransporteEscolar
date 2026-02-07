import { useQuery } from '@tanstack/react-query';
import { dashboardApi, type DashboardResumenParams } from './dashboard.api';

export const dashboardKeys = {
  resumen: (mesesHistorico = 6, limiteActividad = 6) => ['dashboard', 'resumen', mesesHistorico, limiteActividad] as const,
};

export const useDashboardResumen = (options?: DashboardResumenParams) => {
  const mesesHistorico = options?.mesesHistorico ?? 6;
  const limiteActividad = options?.limiteActividad ?? 6;

  return useQuery({
    queryKey: dashboardKeys.resumen(mesesHistorico, limiteActividad),
    queryFn: () => dashboardApi.getResumen({ mesesHistorico, limiteActividad }),
    staleTime: 60_000,
  });
};
