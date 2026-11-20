import { useId } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Amount } from '../../shared/ui/Amount';
import { Button } from '../../shared/ui/Button';
import { PriceInput } from '../../shared/ui/PriceInput';
import { truncateNumberTowardZero } from '../../shared/utils/number.helpers';
import { getTitularApellidoDisplay } from '../../shared/utils/titulares.helpers';
import {
  DICIEMBRE_MOTIVO_NO_VA_BLOQUEADO,
  decisionDesdeEstado,
  getDiciembreEstadoLabel,
  montoInicialDiciembre,
  puedeMarcarNoVa,
} from '../helpers/diciembre.helpers';
import { diciembreFormSchema, type DiciembreFormData } from '../schemas/diciembre.schema';
import { DICIEMBRE_ESTADOS, type DiciembreEstado, type DiciembreTitularItem } from '../types/diciembre.types';

interface DiciembreRowProps {
  titular: DiciembreTitularItem;
  isSaving: boolean;
  onGuardar: (values: DiciembreFormData) => void;
}

const ESTADO_BADGE_CLASSES: Record<DiciembreEstado, string> = {
  [DICIEMBRE_ESTADOS.PENDIENTE]: 'bg-amber-100 text-amber-700',
  [DICIEMBRE_ESTADOS.VA]: 'bg-emerald-100 text-emerald-700',
  [DICIEMBRE_ESTADOS.NO_VA]: 'bg-slate-200 text-slate-700',
};

const RADIO_CLASSES =
  'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 has-[:checked]:border-[#1d8ca5] has-[:checked]:bg-[#1d8ca5]/10 has-[:checked]:text-[#0f181a] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 dark:border-[#3f3f46] dark:text-gray-200 dark:has-[:checked]:text-white';

const INPUT_CLASSES =
  'rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1d8ca5] disabled:bg-gray-100 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white';

export const DiciembreRow = ({ titular, isSaving, onGuardar }: DiciembreRowProps) => {
  const baseId = useId();
  const montoId = `${baseId}-monto`;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<DiciembreFormData>({
    resolver: zodResolver(diciembreFormSchema),
    mode: 'onChange',
    defaultValues: {
      decision: decisionDesdeEstado(titular.estado),
      monto: montoInicialDiciembre(titular),
    },
  });

  const decision = useWatch({ control, name: 'decision' });
  const noVaHabilitado = puedeMarcarNoVa(titular);
  const apellido = getTitularApellidoDisplay(titular.apellido, titular.nombreContacto);

  return (
    <article className="rounded-2xl border border-[#e1e8ec] bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#27272a]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-[#0f181a] dark:text-white">{apellido}</h3>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADO_BADGE_CLASSES[titular.estado]}`}
            >
              {getDiciembreEstadoLabel(titular.estado)}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{titular.nombreContacto}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Pasajeros: {titular.pasajeros.length > 0 ? titular.pasajeros.join(', ') : 'Sin pasajeros activos'}
          </p>
          {titular.totalPagado > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pagado en diciembre: <Amount value={titular.totalPagado} />
            </p>
          )}
          {titular.cuotaPreexistente && (
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Ya tenía una cuota de diciembre cargada
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onGuardar)} noValidate className="flex w-full flex-col gap-3 md:w-80">
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500">¿Va en diciembre?</legend>
            <div className="flex gap-2">
              <label className={RADIO_CLASSES}>
                <input type="radio" value="va" disabled={isSaving} className="accent-[#1d8ca5]" {...register('decision')} />
                Va
              </label>
              <label className={RADIO_CLASSES}>
                <input
                  type="radio"
                  value="noVa"
                  disabled={isSaving || !noVaHabilitado}
                  className="accent-[#1d8ca5]"
                  {...register('decision')}
                />
                No va
              </label>
            </div>
            {!noVaHabilitado && <p className="text-xs text-gray-500 dark:text-gray-400">{DICIEMBRE_MOTIVO_NO_VA_BLOQUEADO}</p>}
            {errors.decision && <p className="text-xs text-red-500">{errors.decision.message}</p>}
          </fieldset>

          {decision === 'va' && (
            <div className="space-y-1">
              <label htmlFor={montoId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Monto de diciembre
              </label>
              <Controller
                control={control}
                name="monto"
                render={({ field }) => (
                  <PriceInput
                    id={montoId}
                    value={field.value ?? ''}
                    onValueChange={(_cleanValue: string, floatValue: number | undefined) =>
                      field.onChange(floatValue === undefined ? undefined : truncateNumberTowardZero(floatValue))
                    }
                    onBlur={field.onBlur}
                    disabled={isSaving}
                    prefix="$"
                    error={Boolean(errors.monto)}
                    inputClassName={INPUT_CLASSES}
                  />
                )}
              />
              {errors.monto ? (
                <p className="text-xs text-red-500">{errors.monto.message}</p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Monto pactado: <Amount value={titular.montoPactado} />
                </p>
              )}
            </div>
          )}

          <Button type="submit" variant="brand" disabled={isSaving || !isValid} className="w-full">
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </form>
      </div>
    </article>
  );
};
