import { useParams, Link } from 'react-router-dom';
import { useTitular } from '../services/titulares.queries';
import { usePasajerosByTitular } from '../../pasajeros/services/pasajeros.queries';
import { Card, CardHeader, CardTitle, CardContent, LoadingScreen, ErrorState, Button } from '../../shared/ui';

export const TitularDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const titularId = Number(id);

  const { data: titular, isLoading: loadingTitular, error: errorTitular } = useTitular(titularId);
  const { data: pasajeros, isLoading: loadingPasajeros } = usePasajerosByTitular(titularId);

  if (loadingTitular) return <LoadingScreen message="Cargando titular..." />;
  if (errorTitular || !titular) return <ErrorState message="Error al cargar el titular" />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <Link to="/titulares" className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm mb-2 inline-block">
          ← Volver a Titulares
        </Link>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mt-2">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{titular.apellido}</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">{titular.nombreContacto}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1 sm:flex-none">Editar</Button>
            <Button variant="danger" size="sm" className="flex-1 sm:flex-none">Dar de Baja</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Titular</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 sm:space-y-3">
              <div>
                <dt className="text-xs sm:text-sm font-medium text-gray-500">Apellido</dt>
                <dd className="text-sm sm:text-base text-gray-900">{titular.apellido}</dd>
              </div>
              <div>
                <dt className="text-xs sm:text-sm font-medium text-gray-500">Contacto</dt>
                <dd className="text-sm sm:text-base text-gray-900">{titular.nombreContacto}</dd>
              </div>
              <div>
                <dt className="text-xs sm:text-sm font-medium text-gray-500">Dirección</dt>
                <dd className="text-sm sm:text-base text-gray-900">{titular.direccion}</dd>
              </div>
              <div>
                <dt className="text-xs sm:text-sm font-medium text-gray-500">Monto Mensual Pactado</dt>
                <dd className="text-sm sm:text-base text-gray-900 font-semibold">${titular.montoMensualPactado.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs sm:text-sm font-medium text-gray-500">Fecha de Alta</dt>
                <dd className="text-sm sm:text-base text-gray-900">{new Date(titular.fechaAlta).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-xs sm:text-sm font-medium text-gray-500">Estado</dt>
                <dd>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    titular.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {titular.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Pasajeros ({pasajeros?.length || 0})</CardTitle>
              <Link to={`/pasajeros/nuevo?titular=${titularId}`}>
                <Button variant="primary" size="sm">+ Agregar</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loadingPasajeros ? (
              <p className="text-gray-500 text-xs sm:text-sm">Cargando pasajeros...</p>
            ) : !pasajeros || pasajeros.length === 0 ? (
              <p className="text-gray-500 text-xs sm:text-sm">No hay pasajeros asociados</p>
            ) : (
              <ul className="space-y-2 sm:space-y-3">
                {pasajeros.map((pasajero) => (
                  <li key={pasajero.id} className="border-b pb-2 sm:pb-3 last:border-0 last:pb-0">
                    <Link
                      to={`/pasajeros/${pasajero.id}`}
                      className="block hover:bg-gray-50 active:bg-gray-100 -mx-2 px-2 py-2 rounded transition-colors"
                    >
                      <p className="text-sm sm:text-base font-medium text-gray-900">{pasajero.nombreCompleto}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{pasajero.colegio} - {pasajero.gradoCurso}</p>
                      <p className="text-xs text-gray-400 mt-1">Turno: {pasajero.turno}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
