import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gastosApi } from './gastos.api';
import type {
  CrearGastoFijoRequest,
  CrearGastoVariableRequest,
  ResumenMensualResponse,
} from '../types/gastos.types';

export const gastosKeys = {
  resumen: (mes: number, anio: number) => ['gastos', 'resumen', mes, anio] as const,
};

export const useGastosResumen = (mes: number | null, anio: number | null) => {
  return useQuery({
    queryKey: mes && anio ? gastosKeys.resumen(mes, anio) : ['gastos', 'resumen', 'idle'],
    queryFn: async (): Promise<ResumenMensualResponse> => {
      return gastosApi.getResumen(mes!, anio!);
    },
    enabled: mes !== null && anio !== null,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
};

export const useCrearGastoFijo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CrearGastoFijoRequest) => {
      return gastosApi.crearGastoFijo(payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: gastosKeys.resumen(variables.mes, variables.anio) });
    },
  });
};

export const useCrearGastoVariable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CrearGastoVariableRequest) => {
      return gastosApi.crearGastoVariable(payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: gastosKeys.resumen(variables.mes, variables.anio) });
    },
  });
};
