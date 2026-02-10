import { z } from 'zod';

/**
 * Schema para validación de teléfonos (E164 format)
 * Formato: +[country code][number] ej: +541141234567
 */
export const telefonoSchema = z.object({
  numeroE164: z
    .string()
    .min(1, { message: 'El teléfono es requerido' })
    .regex(/^\+\d{10,15}$/, {
      message: 'Formato inválido. Debe ser +[código][número] (ej: +541141234567)',
    }),
  esPrincipal: z.boolean().default(false),
});

export const updateTelefonoSchema = z.object({
  numeroE164: z
    .string()
    .min(1, { message: 'El teléfono es requerido' })
    .regex(/^\+\d{10,15}$/, {
      message: 'Formato inválido. Debe ser +[código][número] (ej: +541141234567)',
    }),
});

export type TelefonoFormData = z.infer<typeof telefonoSchema>;
export type UpdateTelefonoFormData = z.infer<typeof updateTelefonoSchema>;
