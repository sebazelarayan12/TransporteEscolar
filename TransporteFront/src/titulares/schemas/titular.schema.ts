import { z } from 'zod';

/**
 * Schema de validación para creación de Titular
 * Replica las validaciones del backend (TitularValidator)
 */
export const createTitularSchema = z.object({
  apellido: z.string().min(1, { message: 'El apellido es requerido' }),
  nombreContacto: z.string().min(1, { message: 'El nombre de contacto es requerido' }),
  direccion: z.string().min(1, { message: 'La dirección es requerida' }),
  montoMensualPactado: z.coerce
    .number({ message: 'El monto debe ser un número válido' })
    .positive({ message: 'El monto debe ser mayor a 0' }),
});

export type CreateTitularFormData = z.output<typeof createTitularSchema>;

/**
 * Schema de validación para actualización de Titular
 * Solo permite editar: nombreContacto, direccion, montoMensualPactado
 */
export const updateTitularSchema = z.object({
  nombreContacto: z.string().min(1, { message: 'El nombre de contacto es requerido' }),
  direccion: z.string().min(1, { message: 'La dirección es requerida' }),
  montoMensualPactado: z.coerce
    .number({ message: 'El monto debe ser un número válido' })
    .positive({ message: 'El monto debe ser mayor a 0' }),
});

export type UpdateTitularFormData = z.output<typeof updateTitularSchema>;
