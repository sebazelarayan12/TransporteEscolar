import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { diciembreApi } from './diciembre.api';
import { QUERY_KEYS as PAGOS_QUERY_KEYS } from '../../pagos/services/pagos.queries';
import type { ConfirmarDiciembreRequest } from '../types/diciembre.types';

export const diciembreKeys = {
  root: ['diciembre'] as const,
  list: (anio: number) => [...diciembreKeys.root, 'list', anio] as const,
};

/**
 * Hook para obtener los titulares con su decisión de diciembre del año indicado
 */
export function useDiciembreList(anio: number) {
  return useQuery({
    queryKey: diciembreKeys.list(anio),
    queryFn: async () => {
      return await diciembreApi.getList(anio);
    },
  });
}

interface ConfirmarDiciembreInput {
  titularId: number;
  body: ConfirmarDiciembreRequest;
}

/**
 * Hook para registrar la decisión de diciembre de un titular (va / no va + monto)
 */
export function useConfirmarDiciembre() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ titularId, body }: ConfirmarDiciembreInput) => diciembreApi.confirmar(titularId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: diciembreKeys.root });
      queryClient.invalidateQueries({ queryKey: PAGOS_QUERY_KEYS.pagos });
    },
  });
}
