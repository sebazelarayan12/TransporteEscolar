import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ingresosApi } from './ingresos.api';
import type {
  ActualizarIngresoFijoRequest,
  CrearIngresoFijoRequest,
  CrearIngresoVariableRequest,
  IngresosResumenMensualResponse,
} from '../types/ingresos.types';
import { gastosKeys } from './gastos.queries';

export const ingresosKeys = {
  resumen: (mes: number, anio: number) => ['ingresos', 'resumen', mes, anio] as const,
};

export const useIngresosResumen = (mes: number | null, anio: number | null) => {
  return useQuery({
    queryKey: mes && anio ? ingresosKeys.resumen(mes, anio) : ['ingresos', 'resumen', 'idle'],
    queryFn: async (): Promise<IngresosResumenMensualResponse> => ingresosApi.getResumen(mes!, anio!),
    enabled: mes !== null && anio !== null,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
};

export const useCrearIngresoFijo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CrearIngresoFijoRequest) => ingresosApi.crearIngresoFijo(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ingresosKeys.resumen(variables.mes, variables.anio) });
      queryClient.invalidateQueries({ queryKey: gastosKeys.resumen(variables.mes, variables.anio) });
    },
  });
};

export const useCrearIngresoVariable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CrearIngresoVariableRequest) => ingresosApi.crearIngresoVariable(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ingresosKeys.resumen(variables.mes, variables.anio) });
      queryClient.invalidateQueries({ queryKey: gastosKeys.resumen(variables.mes, variables.anio) });
    },
  });
};

interface UpdateIngresoFijoVariables {
  templateId: number;
  data: ActualizarIngresoFijoRequest;
}

interface DeleteIngresoPayload {
  id: number;
  mes: number;
  anio: number;
}

interface DeleteIngresoFijoPayload {
  templateId: number;
  mes: number;
  anio: number;
}

const invalidateIngresosResumen = (
  queryClient: ReturnType<typeof useQueryClient>,
  mes: number,
  anio: number,
) => {
  queryClient.invalidateQueries({ queryKey: ingresosKeys.resumen(mes, anio) });
  queryClient.invalidateQueries({ queryKey: gastosKeys.resumen(mes, anio) });
};

export const useActualizarIngresoFijo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, data }: UpdateIngresoFijoVariables) => ingresosApi.updateIngresoFijo(templateId, data),
    onSuccess: (_, variables) => {
      invalidateIngresosResumen(queryClient, variables.data.mes, variables.data.anio);
    },
  });
};

export const useEliminarIngresoFijo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId }: DeleteIngresoFijoPayload) => ingresosApi.deleteIngresoFijo(templateId),
    onSuccess: (_, variables) => {
      invalidateIngresosResumen(queryClient, variables.mes, variables.anio);
    },
  });
};

export const useEliminarIngresoVariable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: DeleteIngresoPayload) => ingresosApi.deleteIngresoVariable(id),
    onSuccess: (_, variables) => {
      invalidateIngresosResumen(queryClient, variables.mes, variables.anio);
    },
  });
};
