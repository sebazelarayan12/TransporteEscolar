import type { ReactNode } from 'react';
import { fieldErrorId } from '../utils/form-field.helpers';

interface FormFieldProps {
  /** Id del control que envuelve (se usa para asociar label y mensaje de error). */
  id: string;
  label: string;
  required?: boolean;
  /** Texto secundario junto al label, ej: "(opcional)". */
  labelHint?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/** Campo de formulario: label + control + mensaje de error / ayuda. */
export const FormField = ({ id, label, required = false, labelHint, error, hint, children }: FormFieldProps) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {label}
      {required && (
        <>
          {' '}
          <span className="text-red-500" aria-hidden="true">*</span>
        </>
      )}
      {labelHint && <span className="ml-1 text-xs text-gray-500">{labelHint}</span>}
    </label>
    {children}
    {error && (
      <p id={fieldErrorId(id)} role="alert" className="mt-1.5 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">error</span>
        {error}
      </p>
    )}
    {hint && <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
  </div>
);
