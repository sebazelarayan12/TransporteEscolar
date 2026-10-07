import { z } from 'zod';

export const loginFormSchema = z.object({
  usuario: z.string().trim().min(1, { message: 'Ingresá tu usuario' }),
  password: z.string().min(1, { message: 'Ingresá tu contraseña' }),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
