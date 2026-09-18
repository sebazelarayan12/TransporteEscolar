import { Button } from './Button';

interface FormActionsProps {
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
  /** Deshabilita el submit además de cuando está pendiente (ej: formulario sin cambios). */
  submitDisabled?: boolean;
}

/** Botones Cancelar / Guardar comunes a los formularios. */
export const FormActions = ({ onCancel, isPending, submitLabel, submitDisabled = false }: FormActionsProps) => (
  <div className="flex flex-col sm:flex-row gap-3 pt-4">
    <Button
      type="button"
      variant="ghost"
      onClick={onCancel}
      disabled={isPending}
      className="w-full sm:w-auto order-2 sm:order-1"
    >
      Cancelar
    </Button>
    <Button
      type="submit"
      disabled={isPending || submitDisabled}
      className="w-full sm:flex-1 sm:order-2 bg-[#007a8a] hover:bg-[#00626e] text-white disabled:bg-gray-400 disabled:hover:bg-gray-400"
    >
      <span className="flex items-center justify-center gap-2">
        {isPending ? (
          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
        ) : (
          <span className="material-symbols-outlined text-[20px]">save</span>
        )}
        {isPending ? 'Guardando...' : submitLabel}
      </span>
    </Button>
  </div>
);
