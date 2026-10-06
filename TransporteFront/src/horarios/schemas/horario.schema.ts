import { z } from 'zod';
import { armarEtiqueta } from '../helpers/etiqueta.helpers';

const ETIQUETA_MAX = 100;
const HORA_REGEX = /^(?:[01]?\d|2[0-3])(?::[0-5]\d)?$/;

const ordenSchema = z.coerce.number({ message: 'El orden debe ser un número' }).int().min(1, { message: 'El orden debe ser 1 o más' });

/** Al crear, el orden puede quedar vacío (null): el backend usa el siguiente disponible. */
const ordenOpcionalSchema = z.preprocess(
  (valor) => (valor === '' || valor === null || valor === undefined ? null : valor),
  ordenSchema.nullable(),
);

/** Replica las validaciones del backend (HorarioValidator). La etiqueta final es hora + descripción. */
const armarSchema = <TOrden extends z.ZodType>(orden: TOrden) =>
  z
    .object({
      hora: z.string().trim().regex(HORA_REGEX, { message: 'Ingresá la hora, por ejemplo 8 o 13:30' }),
      descripcion: z.string().trim().min(1, { message: 'La descripción es requerida' }),
      colegioId: z.coerce.number({ message: 'Elegí un colegio' }).int().positive({ message: 'Elegí un colegio' }),
      sentido: z.enum(['Ida', 'Vuelta'], { message: 'Elegí Ida o Vuelta' }),
      orden,
    })
    .refine((datos) => armarEtiqueta(datos.hora, datos.descripcion).length <= ETIQUETA_MAX, {
      message: `La etiqueta no puede superar los ${ETIQUETA_MAX} caracteres`,
      path: ['descripcion'],
    });

/** Edición: el orden es obligatorio. */
export const horarioFormSchema = armarSchema(ordenSchema);

/** Creación: el orden es opcional. */
export const horarioCrearFormSchema = armarSchema(ordenOpcionalSchema);

export type HorarioFormInput = z.input<typeof horarioFormSchema>;
export type HorarioFormData = z.output<typeof horarioFormSchema>;
export type HorarioCrearFormData = z.output<typeof horarioCrearFormSchema>;
