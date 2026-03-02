import { Spinner } from '../../shared/ui';
import type { ReinscripcionActionVariant, ReinscripcionActionDefinition } from '../types/reinscripcion-actions.types';

interface ReinscripcionActionCardsProps {
  actions: ReinscripcionActionDefinition[];
  disabled: boolean;
  currentActionId: ReinscripcionActionVariant | null;
  onAction: (variant: ReinscripcionActionVariant) => void;
}

export const ReinscripcionActionCards = ({
  actions,
  disabled,
  currentActionId,
  onAction,
}: ReinscripcionActionCardsProps) => {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {actions.map((action) => {
        const isCurrentAction = currentActionId === action.id;

        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onAction(action.id)}
            disabled={disabled}
            className={`rounded-2xl px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              action.classes
            } ${
              disabled ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-0.5 focus-visible:ring-[#1d8ca5]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{action.label}</p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{action.description}</p>
              </div>
              {isCurrentAction ? (
                <Spinner size="sm" />
              ) : (
                <span className={`material-symbols-outlined text-2xl ${action.iconColor}`}>{action.icon}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
