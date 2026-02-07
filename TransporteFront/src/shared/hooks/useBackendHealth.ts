import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

/**
 * Hook para verificar el estado del backend
 */
export function useBackendHealth() {
  return useQuery({
    queryKey: ['backend-health'],
    queryFn: async () => {
      try {
        // Intentamos hacer un request simple al backend
        await apiClient.get('/titulares');
        return { isHealthy: true };
      } catch (error) {
        return { isHealthy: false };
      }
    },
    refetchInterval: 30000, // Refetch cada 30 segundos
    retry: false, // No reintentar automáticamente
  });
}
