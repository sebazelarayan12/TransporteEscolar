const INPUT_BASE =
  'rounded-lg border text-gray-900 dark:text-white bg-white dark:bg-[#27272a] focus:outline-none focus:ring-2 focus:ring-[#007a8a] focus:border-transparent transition-colors';

const PADDING_BY_VARIANT = {
  default: 'w-full px-4 py-2.5',
  price: 'w-full pr-4 py-2.5',
} as const;

/** Clases de un input de formulario; el borde pasa a rojo cuando tiene error. */
export const fieldInputClass = (hasError: boolean, variant: keyof typeof PADDING_BY_VARIANT = 'default') =>
  `${PADDING_BY_VARIANT[variant]} ${INPUT_BASE} ${
    hasError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-[#3f3f46]'
  }`;

/** Id del mensaje de error asociado a un campo. */
export const fieldErrorId = (id: string) => `${id}-error`;

/** Atributos ARIA de un campo según tenga o no error. */
export const fieldAriaProps = (id: string, error?: string) => ({
  'aria-invalid': error ? ('true' as const) : ('false' as const),
  'aria-describedby': error ? fieldErrorId(id) : undefined,
});
