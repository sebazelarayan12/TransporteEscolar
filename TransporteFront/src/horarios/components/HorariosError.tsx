import { Button, ErrorState } from '../../shared/ui';

type HorariosErrorProps = {
  onRetry: () => void;
};

export const HorariosError = ({ onRetry }: HorariosErrorProps) => {
  return (
    <div className="px-4 py-8">
      <ErrorState message="No pudimos obtener los horarios. Intenta nuevamente." />
      <div className="mt-4">
        <Button onClick={onRetry}>Reintentar</Button>
      </div>
    </div>
  );
};
