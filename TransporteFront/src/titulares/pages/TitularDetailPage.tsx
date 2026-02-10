import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTitular, useTitularTelefonos, useUpdateTitular, useMarkTitularTelefonoPrincipal } from '../services/titulares.queries';
import { usePasajerosByTitular } from '../../pasajeros/services/pasajeros.queries';
import { LoadingScreen, ErrorState } from '../../shared/ui';
import { TitularPhoneList } from '../components/TitularPhoneList';
import { TitularPasajerosList } from '../components/TitularPasajerosList';
import { TitularEditModal } from '../components/TitularEditModal';
import { TitularPhoneEditModal } from '../components/TitularPhoneEditModal';
import { useToast } from '../../shared/hooks';
import type { UpdateTitularFormData } from '../schemas/titular.schema';
import type { TitularTelefonoResponse } from '../types/titular.types';

const formatDate = (value: string | null) => {
  if (!value) return null;
  const formatter = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' });
  return formatter.format(new Date(value));
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
};

export const TitularDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const titularId = Number(id);
  const titularIdForMutation = Number.isNaN(titularId) ? 0 : titularId;

  const { data: titular, isLoading: loadingTitular, error: errorTitular } = useTitular(titularId);
  const { data: telefonos, isLoading: telefonosLoading, error: telefonosError, refetch: refetchTelefonos } = useTitularTelefonos(titularId);
  const { data: pasajeros, isLoading: pasajerosLoading, error: pasajerosError, refetch: refetchPasajeros } = usePasajerosByTitular(titularId);

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [markingPhoneId, setMarkingPhoneId] = useState<number | null>(null);
  const [editingPhone, setEditingPhone] = useState<TitularTelefonoResponse | null>(null);
  const { showSuccess, showError } = useToast();
  const { mutateAsync: updateTitular, isPending: isUpdating } = useUpdateTitular();
  const { mutateAsync: markTelefonoPrincipal } = useMarkTitularTelefonoPrincipal(titularIdForMutation);

  const handleSaveTitular = async (data: UpdateTitularFormData) => {
    try {
      await updateTitular({ id: titularId, data });
      showSuccess('Titular actualizado correctamente');
      setEditModalOpen(false);
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : 'Error al actualizar el titular';
      showError(errorMessage);
    }
  };

  const handleMarkTelefonoPrincipal = async (telefonoId: number) => {
    if (!Number.isFinite(titularId)) {
      showError('No se pudo identificar al titular');
      return;
    }

    try {
      setMarkingPhoneId(telefonoId);
      await markTelefonoPrincipal(telefonoId);
      showSuccess('Teléfono marcado como principal');
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'No se pudo marcar el teléfono como principal';
      showError(errorMessage);
    } finally {
      setMarkingPhoneId(null);
    }
  };

  const handleOpenPhoneModal = (phone: TitularTelefonoResponse) => {
    setEditingPhone(phone);
  };

  const handleClosePhoneModal = () => {
    setEditingPhone(null);
  };

  if (loadingTitular) return <LoadingScreen message="Cargando titular..." />;
  if (errorTitular || !titular) return <ErrorState message="Error al cargar el titular" />;

  return (
    <div className="min-h-full w-full bg-[#fafafa] dark:bg-[#18181b]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex h-full w-full flex-col gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate('/titulares')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#007a8a] hover:text-[#00626e] transition-colors self-start"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver a Titulares
        </button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#007a8a] to-[#00626e] text-2xl font-bold text-white shadow-lg">
                {titular.apellido.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{titular.apellido}</h1>
                <p className="text-base text-gray-600 dark:text-gray-300">{titular.nombreContacto}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                titular.activo 
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-400/20' 
                  : 'bg-gray-100 text-gray-600 ring-1 ring-gray-600/20 dark:bg-white/10 dark:text-gray-300 dark:ring-white/20'
              }`}>
                <span className={`h-2 w-2 rounded-full ${titular.activo ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                {titular.activo ? 'Activo' : 'Inactivo'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ID #{titular.id} • Alta {formatDate(titular.fechaAlta)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => setEditModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#007a8a] bg-white px-5 py-2.5 font-semibold text-[#007a8a] shadow-sm transition hover:bg-[#007a8a]/5 dark:bg-[#27272a] dark:hover:bg-[#007a8a]/10"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Editar Titular
            </button>
            <button className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 font-semibold text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-800 dark:bg-[#27272a] dark:text-red-400 dark:hover:bg-red-900/10">
              <span className="material-symbols-outlined text-[18px]">block</span>
              Dar de Baja
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Información General */}
            <div className="rounded-2xl border border-[#e4e4e7] bg-white shadow-sm dark:border-[#3f3f46] dark:bg-[#27272a] overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 dark:border-white/5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-[#007a8a]">info</span>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Información General</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="rounded-xl border border-gray-100 p-4 dark:border-white/10">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Apellido</p>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">{titular.apellido}</p>
                </div>
                <div className="rounded-xl border border-gray-100 p-4 dark:border-white/10">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nombre de Contacto</p>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">{titular.nombreContacto}</p>
                </div>
                <div className="rounded-xl border border-gray-100 p-4 dark:border-white/10">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Dirección</p>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">{titular.direccion}</p>
                </div>
              </div>
            </div>

            {/* Teléfonos */}
            <div className="rounded-2xl border border-[#e4e4e7] bg-white shadow-sm dark:border-[#3f3f46] dark:bg-[#27272a] overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 dark:border-white/5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-[#007a8a]">call</span>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Teléfonos</h2>
                </div>
              </div>
              <div className="p-6">
                 <TitularPhoneList
                   phones={telefonos}
                   isLoading={telefonosLoading}
                   error={telefonosError ? 'No se pudieron cargar los teléfonos.' : undefined}
                   onRetry={refetchTelefonos}
                   showHeader={false}
                   titularNombre={titular.nombreContacto}
                   titularId={titular.id}
                   onMarkPrincipal={handleMarkTelefonoPrincipal}
                   markingPhoneId={markingPhoneId}
                   onEditPhone={handleOpenPhoneModal}
                  />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Información Financiera */}
            <div className="rounded-2xl border border-[#e4e4e7] bg-white shadow-sm dark:border-[#3f3f46] dark:bg-[#27272a] overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 dark:border-white/5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-[#007a8a]">payments</span>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Información Financiera</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="rounded-2xl bg-gradient-to-br from-[#007a8a] to-[#00626e] p-6 text-white shadow-lg">
                  <p className="text-sm font-semibold uppercase tracking-wide opacity-90">Monto Mensual Pactado</p>
                  <p className="mt-2 text-4xl font-bold">{formatCurrency(titular.montoMensualPactado)}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm opacity-80">
                    <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                    <span>Renovación mensual</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pasajeros */}
            <div className="rounded-2xl border border-[#e4e4e7] bg-white shadow-sm dark:border-[#3f3f46] dark:bg-[#27272a] overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 dark:border-white/5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-[#007a8a]">school</span>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Pasajeros Asociados
                  </h2>
                  {pasajeros && pasajeros.length > 0 && (
                    <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#007a8a] text-xs font-bold text-white">
                      {pasajeros.length}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6">
                <TitularPasajerosList
                  pasajeros={pasajeros}
                  isLoading={pasajerosLoading}
                  error={pasajerosError ? 'No se pudieron cargar los pasajeros.' : undefined}
                  onRetry={refetchPasajeros}
                  showAddButton={false}
                />
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <TitularEditModal
        titular={titular}
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveTitular}
        isSaving={isUpdating}
      />
      {editingPhone && (
        <TitularPhoneEditModal
          titularId={titular.id}
          phone={editingPhone}
          isOpen={Boolean(editingPhone)}
          onClose={handleClosePhoneModal}
        />
      )}
    </div>
  );
};
