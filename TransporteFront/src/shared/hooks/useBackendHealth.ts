import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

type HealthResponse = {
  status?: string;
};

/**
 * Hook para verificar el estado del backend con un ping ligero
 */
export function useBackendHealth() {
  return useQuery({
    queryKey: ['backend-health'],
    queryFn: async () => {
      try {
        const health = await apiClient.get<HealthResponse>('/health');
        const normalizedStatus = health.status?.toLowerCase();
        return { isHealthy: normalizedStatus === 'healthy' };
      } catch {
        return { isHealthy: false };
      }
    },
    refetchInterval: 30000, // Refetch cada 30 segundos
    retry: false, // No reintentar automáticamente
  });
}
