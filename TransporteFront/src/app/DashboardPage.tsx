import { Card, CardHeader, CardTitle, CardContent } from '../shared/ui';

export const DashboardPage = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <p className="text-sm sm:text-base text-gray-600">Bienvenido al portal de gestión de transporte escolar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>👥 Titulares</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              Gestiona los datos de contacto y facturación de las familias.
            </p>
            <a
              href="/titulares"
              className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium inline-block"
            >
              Ver titulares →
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎒 Pasajeros</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              Administra la información de los estudiantes que utilizan el servicio.
            </p>
            <a
              href="/pasajeros"
              className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium inline-block"
            >
              Ver pasajeros →
            </a>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 sm:space-y-3">
            <div>
              <dt className="text-xs sm:text-sm font-medium text-gray-500">Estado</dt>
              <dd className="text-sm sm:text-base text-gray-900">Portal operativo (sin autenticación)</dd>
            </div>
            <div>
              <dt className="text-xs sm:text-sm font-medium text-gray-500">Backend</dt>
              <dd className="text-xs sm:text-sm text-gray-900 break-all">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:5074/api'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
};
