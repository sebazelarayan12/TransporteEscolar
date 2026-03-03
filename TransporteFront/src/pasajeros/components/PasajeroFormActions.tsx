import { Button } from '../../shared/ui';

interface PasajeroFormActionsProps {
  isSaving: boolean;
  isLoadingTitulares: boolean;
  onCancel: () => void;
}

export const PasajeroFormActions = ({
  isSaving,
  isLoadingTitulares,
  onCancel,
}: PasajeroFormActionsProps) => {
  return (
    <div className="flex flex-col gap-3 pt-4 sm:flex-row">
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        disabled={isSaving}
        className="order-2 w-full sm:order-1 sm:w-auto"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        disabled={isSaving || isLoadingTitulares}
        className="w-full bg-[#007a8a] text-white hover:bg-[#00626e] disabled:bg-gray-400 disabled:hover:bg-gray-400 sm:order-2 sm:flex-1"
      >
        {isSaving ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></span>
            Guardando...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[20px]">save</span>
            Guardar Pasajero
          </span>
        )}
      </Button>
    </div>
  );
};
