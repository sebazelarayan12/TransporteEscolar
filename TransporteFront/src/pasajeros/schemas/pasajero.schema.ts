import { z } from 'zod';

/**
 * Opciones válidas para el turno del pasajero
 */
export const TURNO_OPTIONS = [
  'Mañana',
  'Tarde',
  'Doble turno',
] as const;

/**
 * Schema de validación para creación de Pasajero
 * Replica las validaciones del backend (PasajeroModel.Request)
 */
export const createPasajeroSchema = z.object({
  titularId: z
    .number({ message: 'El titular es requerido' })
    .int({ message: 'El titular debe ser un número entero' })
    .positive({ message: 'Debe seleccionar un titular' }),
  nombre: z
    .string({ message: 'El nombre es requerido' })
    .min(1, { message: 'El nombre es requerido' })
    .max(100, { message: 'El nombre no puede exceder 100 caracteres' }),
  colegio: z
    .string({ message: 'El colegio es requerido' })
    .min(1, { message: 'El colegio es requerido' })
    .max(200, { message: 'El colegio no puede exceder 200 caracteres' }),
  gradoCurso: z
    .string({ message: 'El grado/curso es requerido' })
    .min(1, { message: 'El grado/curso es requerido' })
    .max(50, { message: 'El grado/curso no puede exceder 50 caracteres' }),
  turno: z.enum(TURNO_OPTIONS, {
    message: 'Debe seleccionar un turno válido',
  }),
  observaciones: z
    .string()
    .max(500, { message: 'Las observaciones no pueden exceder 500 caracteres' })
    .optional()
    .or(z.literal('')),
});

export type CreatePasajeroFormData = z.infer<typeof createPasajeroSchema>;
