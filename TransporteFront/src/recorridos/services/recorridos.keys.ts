export const recorridosKeys = {
  all: ['recorridos'] as const,
  ubicacion: (titularId: number) => [...recorridosKeys.all, 'ubicacion', titularId] as const,
  recorridos: (titularId: number) => [...recorridosKeys.all, 'titular', titularId] as const,
  colegios: () => [...recorridosKeys.all, 'colegios'] as const,
  direcciones: (consulta: string) => [...recorridosKeys.all, 'direcciones', consulta] as const,
};
