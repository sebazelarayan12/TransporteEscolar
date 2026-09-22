import type { TransporteTipo } from '../../shared/types/transporte.types';

export const recorridosKeys = {
  all: ['recorridos'] as const,
  ubicacion: (titularId: number) => [...recorridosKeys.all, 'ubicacion', titularId] as const,
  recorridos: (titularId: number) => [...recorridosKeys.all, 'titular', titularId] as const,
  colegios: () => [...recorridosKeys.all, 'colegios'] as const,
  analisis: () => [...recorridosKeys.all, 'analisis'] as const,
  direcciones: (consulta: string) => [...recorridosKeys.all, 'direcciones', consulta] as const,
  paradasFijas: () => [...recorridosKeys.all, 'paradas-fijas'] as const,
  recorridoViaje: (horarioId: number, transporte: TransporteTipo) =>
    [...recorridosKeys.all, 'viaje', horarioId, transporte] as const,
};
