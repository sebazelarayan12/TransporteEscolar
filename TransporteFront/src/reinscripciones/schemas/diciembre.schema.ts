import { z } from 'zod';
import { formatCurrency } from '../../shared/utils/currency.helpers';
import { DICIEMBRE_MONTO_MAXIMO } from '../helpers/diciembre.helpers';

export const diciembreFormSchema = z
  .object({
    decision: z.enum(['va', 'noVa'], { error: 'Elegí si va o no va en diciembre' }),
    monto: z.number({ error: 'Ingresá un monto válido' }).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.decision !== 'va') {
      return;
    }

    const monto = values.monto;

    if (monto === undefined || !Number.isFinite(monto)) {
      ctx.addIssue({ code: 'custom', path: ['monto'], message: 'Ingresá un monto válido' });
      return;
    }

    if (monto <= 0) {
      ctx.addIssue({ code: 'custom', path: ['monto'], message: 'El monto debe ser mayor a 0' });
      return;
    }

    if (monto > DICIEMBRE_MONTO_MAXIMO) {
      ctx.addIssue({
        code: 'custom',
        path: ['monto'],
        message: `El monto máximo es ${formatCurrency(DICIEMBRE_MONTO_MAXIMO)}`,
      });
    }
  });

export type DiciembreFormData = z.infer<typeof diciembreFormSchema>;
