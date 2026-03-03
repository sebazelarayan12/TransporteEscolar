import { Button, Spinner } from '../../shared/ui';

interface GastoModalActionsProps {
  isPending: boolean;
  isEditMode: boolean;
  onCancel: () => void;
}

export const GastoModalActions = ({ isPending, isEditMode, onCancel }: GastoModalActionsProps) => {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
        Cancelar
      </Button>
      <Button type="submit" variant="brand" disabled={isPending} className="inline-flex items-center gap-2">
        {isPending ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-[18px]">task_alt</span>}
        {isEditMode ? 'Guardar cambios' : 'Guardar'}
      </Button>
    </div>
  );
};
