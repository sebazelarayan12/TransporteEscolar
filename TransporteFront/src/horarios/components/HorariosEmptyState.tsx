import { Button, Card, CardContent, CardHeader, CardTitle } from '../../shared/ui';

interface HorariosEmptyStateProps {
  onNuevoHorario?: () => void;
}

export const HorariosEmptyState = ({ onNuevoHorario }: HorariosEmptyStateProps) => {
  return (
    <div className="px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Horarios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Aún no hay horarios configurados.</p>
          {onNuevoHorario ? (
            <Button variant="brand" size="sm" onClick={onNuevoHorario} className="mt-4">
              Crear el primer horario
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
