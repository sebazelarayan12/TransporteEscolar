import { useTitularesActivos } from '../api/titulares.queries';
import { Card, CardContent, LoadingScreen, ErrorState, EmptyState, Button } from '../../shared/ui';
import { Link } from 'react-router-dom';

export const TitularesListPage = () => {
  const { data: titulares, isLoading, error } = useTitularesActivos();

  if (isLoading) return <LoadingScreen message="Cargando titulares..." />;
  if (error) return <ErrorState message="Error al cargar los titulares" />;
  if (!titulares || titulares.length === 0) return <EmptyState message="No hay titulares activos" />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <p className="text-sm sm:text-base text-gray-600">Gestión de familias y contactos</p>
        </div>
        <Link to="/titulares/nuevo">
          <Button variant="primary" className="w-full sm:w-auto">+ Nuevo Titular</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {titulares.map((titular) => (
          <Card key={titular.id}>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {/* Header con título y badge */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{titular.apellido}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                    titular.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {titular.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div>
                    <p className="text-gray-500">Contacto</p>
                    <p className="font-medium text-gray-900">{titular.nombreContacto}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Dirección</p>
                    <p className="font-medium text-gray-900">{titular.direccion}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Monto Mensual</p>
                    <p className="font-medium text-gray-900">${titular.montoMensualPactado.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Fecha Alta</p>
                    <p className="font-medium text-gray-900">{new Date(titular.fechaAlta).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
                  <Link to={`/titulares/${titular.id}`} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full">Ver Detalle</Button>
                  </Link>
                  <Link to={`/pasajeros?titular=${titular.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">Ver Pasajeros</Button>
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
