import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui';

export const HorariosEmptyState = () => {
  return (
    <div className="px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Horarios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Aún no hay horarios configurados. Crea los horarios en el backend para comenzar.</p>
        </CardContent>
      </Card>
    </div>
  );
};
