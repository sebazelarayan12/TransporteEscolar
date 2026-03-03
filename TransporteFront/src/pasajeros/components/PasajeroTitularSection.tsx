import type { FieldError } from 'react-hook-form';
import { TitularCombobox } from './TitularCombobox';
import type { TitularResponse } from '../../titulares/types/titular.types';

interface PasajeroTitularSectionProps {
  titulares?: TitularResponse[];
  titularId: number;
  titularInputId: string;
  titularErrorId: string;
  titularDireccionFieldId: string;
  isLoadingTitulares: boolean;
  isSaving: boolean;
  error: FieldError | undefined;
  initialSearchTerm?: string;
  selectedTitular?: TitularResponse;
  onTitularChange: (value: number) => void;
}

export const PasajeroTitularSection = ({
  titulares,
  titularId,
  titularInputId,
  titularErrorId,
  titularDireccionFieldId,
  isLoadingTitulares,
  isSaving,
  error,
  initialSearchTerm,
  selectedTitular,
  onTitularChange,
}: PasajeroTitularSectionProps) => {
  return (
    <section className="space-y-4">
      <div>
        <label
          htmlFor={titularInputId}
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Titular <span className="text-red-500">*</span>
        </label>
        {isLoadingTitulares ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#007a8a]"></span>
            Cargando titulares...
          </div>
        ) : (
          <TitularCombobox
            titulares={titulares || []}
            value={titularId || 0}
            onChange={onTitularChange}
            error={error?.message}
            disabled={isSaving}
            initialSearchTerm={initialSearchTerm}
            inputId={titularInputId}
            ariaDescribedBy={error ? titularErrorId : undefined}
            ariaInvalid={Boolean(error)}
          />
        )}
        {error && (
          <p id={titularErrorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {error.message}
          </p>
        )}
      </div>

      {titularId > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
          <label
            htmlFor={titularDireccionFieldId}
            className="mb-2 block text-sm font-medium text-blue-700 dark:text-blue-300"
          >
            Dirección del Titular
          </label>
          <output
            id={titularDireccionFieldId}
            className="block text-sm text-blue-900 dark:text-blue-100"
          >
            {selectedTitular?.direccion || 'No disponible'}
          </output>
        </div>
      )}
    </section>
  );
};
