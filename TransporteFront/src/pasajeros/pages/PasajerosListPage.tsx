import { usePasajerosActivos } from '../services/pasajeros.queries';
import { Card, CardContent, LoadingScreen, ErrorState, EmptyState, Button } from '../../shared/ui';
import { Link } from 'react-router-dom';

export const PasajerosListPage = () => {
  const { data: pasajeros, isLoading, error } = usePasajerosActivos();

  if (isLoading) return <LoadingScreen message="Cargando pasajeros..." />;
  if (error) return <ErrorState message="Error al cargar los pasajeros" />;
  if (!pasajeros || pasajeros.length === 0) return <EmptyState message="No hay pasajeros activos" />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <p className="text-sm sm:text-base text-gray-600">Estudiantes que utilizan el servicio</p>
        </div>
        <Link to="/pasajeros/nuevo">
          <Button variant="primary" className="w-full sm:w-auto">+ Nuevo Pasajero</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {pasajeros.map((pasajero) => (
          <Card key={pasajero.id}>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex-1">{pasajero.nombreCompleto}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                    pasajero.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {pasajero.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
                  <div>
                    <p className="text-gray-500">Titular</p>
                    <p className="font-medium text-gray-900">{pasajero.titularApellido || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Colegio</p>
                    <p className="font-medium text-gray-900 truncate" title={pasajero.colegio}>{pasajero.colegio}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Grado/Curso</p>
                    <p className="font-medium text-gray-900">{pasajero.gradoCurso}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Turno</p>
                    <p className="font-medium text-gray-900">{pasajero.turno}</p>
                  </div>
                </div>

                {/* Observaciones */}
                {pasajero.observaciones && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Observaciones:</p>
                    <p className="text-xs sm:text-sm text-gray-700 italic">{pasajero.observaciones}</p>
                  </div>
                )}

                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
                  <Link to={`/pasajeros/${pasajero.id}`} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full">Ver Detalle</Button>
                  </Link>
                  <Link to={`/titulares/${pasajero.titularId}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">Ver Titular</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
