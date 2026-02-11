/**
 * Balance priority state constants
 * Defines states for prioritized balance display logic
 */

export const SALDO_PRIORITARIO_ESTADO = {
  AL_DIA: 'alDia',
  PROXIMO_PERIODO: 'proximoPeriodo',
  MES_EN_CURSO: 'mesEnCurso',
  VENCIDO: 'vencido',
} as const;

export type SaldoPrioritarioEstado = (typeof SALDO_PRIORITARIO_ESTADO)[keyof typeof SALDO_PRIORITARIO_ESTADO];

interface SaldoPrioritarioBadge {
  label: string;
  className: string;
}

/**
 * Badge configuration for each balance state
 */
export const SALDO_PRIORITARIO_BADGE_BY_ESTADO: Record<SaldoPrioritarioEstado, SaldoPrioritarioBadge> = {
  [SALDO_PRIORITARIO_ESTADO.AL_DIA]: {
    label: 'Al día',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  },
  [SALDO_PRIORITARIO_ESTADO.PROXIMO_PERIODO]: {
    label: 'Próximo período',
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300',
  },
  [SALDO_PRIORITARIO_ESTADO.MES_EN_CURSO]: {
    label: 'Mes en curso',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  },
  [SALDO_PRIORITARIO_ESTADO.VENCIDO]: {
    label: 'Saldo vencido',
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300',
  },
};

/**
 * Text color classes for each balance state
 */
export const SALDO_PRIORITARIO_COLOR_BY_ESTADO: Record<SaldoPrioritarioEstado, string> = {
  [SALDO_PRIORITARIO_ESTADO.AL_DIA]: 'text-emerald-600 dark:text-emerald-300',
  [SALDO_PRIORITARIO_ESTADO.PROXIMO_PERIODO]: 'text-sky-600 dark:text-sky-300',
  [SALDO_PRIORITARIO_ESTADO.MES_EN_CURSO]: 'text-amber-600 dark:text-amber-300',
  [SALDO_PRIORITARIO_ESTADO.VENCIDO]: 'text-rose-600 dark:text-rose-300',
};
