import { useState } from 'react';
import type { FormEvent } from 'react';
import { Modal, SearchInput, Button } from '../../shared/ui';
import { usePagosPorTitular, useRegistrarPago, useTitularesConPagos } from '../services/pagos.queries';
import { useToast } from '../../shared/hooks/useToast';
import { useDebounce } from '../../shared/hooks/useDebounce';
import type { TitularResponse } from '../../titulares/types/titular.types';

const MEDIOS_PAGO = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
} as const;

type MedioPago = (typeof MEDIOS_PAGO)[keyof typeof MEDIOS_PAGO];

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
});

const formatCurrency = (value: number) => currencyFormatter.format(value);

const formatDate = (isoDate: string) => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  return parsed.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatDateTime = (isoDate: string) => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  return parsed.toLocaleString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const titularButtonBaseClasses =
  'w-full rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d8ca5] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1f1f24]';

interface RegistrarPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PagoConfirmacionData {
  pagoId: number;
  titularNombreCompleto: string;
  monto: number;
  medioPago: MedioPago;
  observaciones?: string;
  fechaPagoIso: string;
  periodoDestino: string;
}

export const RegistrarPagoModal = ({ isOpen, onClose, onSuccess }: RegistrarPagoModalProps) => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const trimmedSearch = debouncedSearch.trim();
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;
  const [selectedTitular, setSelectedTitular] = useState<TitularResponse | null>(null);
  const selectedTitularId = selectedTitular?.id ?? null;
  const [monto, setMonto] = useState('');
  const [medioPago, setMedioPago] = useState<MedioPago>(MEDIOS_PAGO.EFECTIVO);
  const [observaciones, setObservaciones] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmacionPago, setConfirmacionPago] = useState<PagoConfirmacionData | null>(null);

  const {
    data: titularesResponse,
    isLoading: isLoadingTitulares,
    isError: hasTitularesError,
    error: titularesError,
    isFetching: isFetchingTitulares,
  } = useTitularesConPagos(trimmedSearch, pageNumber, pageSize);
  const {
    data: pagosTitular,
    isFetching: isFetchingPagos,
    isLoading: isLoadingPagos,
  } = usePagosPorTitular(selectedTitularId);
  const registrarPago = useRegistrarPago();
  const { showSuccess, showError } = useToast();

  const titulares = titularesResponse?.data ?? [];
  const totalCount = titularesResponse?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPreviousPage = pageNumber > 1;
  const hasNextPage = pageNumber < totalPages;
  const startItem = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const endItem = Math.min(pageNumber * pageSize, totalCount);

  const pagosOrdenados = [...(pagosTitular ?? [])].sort((a, b) => {
    if (a.anio === b.anio) {
      return a.mes - b.mes;
    }
    return a.anio - b.anio;
  });

  const saldoTotalPendiente = pagosOrdenados.reduce((acc, pago) => acc + Math.max(0, pago.saldoPendiente), 0);
  const cuotasConDeuda = pagosOrdenados.filter((pago) => pago.saldoPendiente > 0);
  const proximoVencimientoIso = cuotasConDeuda.reduce<string | null>((closest, cuota) => {
    if (!closest) {
      return cuota.fechaVencimiento;
    }
    return new Date(cuota.fechaVencimiento) < new Date(closest) ? cuota.fechaVencimiento : closest;
  }, null);
  const proximoVencimientoLabel = proximoVencimientoIso ? formatDate(proximoVencimientoIso) : 'Sin deudas activas';

  const montoNumber = parseFloat(monto);
  const isMontoValid = monto.trim() !== '' && Number.isFinite(montoNumber) && montoNumber > 0;
  const tieneCuotas = pagosOrdenados.length > 0;
  const canSubmit = Boolean(selectedTitular && tieneCuotas && isMontoValid) && !registrarPago.isPending;

  const resetState = () => {
    setSearch('');
    setPageNumber(1);
    setSelectedTitular(null);
    setMonto('');
    setMedioPago(MEDIOS_PAGO.EFECTIVO);
    setObservaciones('');
  };

  const closeConfirmacionModal = () => {
    setIsConfirmOpen(false);
    setConfirmacionPago(null);
  };

  const handleConfirmacionClose = () => {
    if (registrarPago.isPending) {
      return;
    }
    closeConfirmacionModal();
  };

  const handleClose = () => {
    closeConfirmacionModal();
    resetState();
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const pagoDestino = pagosOrdenados[0];
    if (!selectedTitular || !pagoDestino || !isMontoValid) {
      return;
    }

    const fechaPagoIso = new Date().toISOString();
    const trimmedObservaciones = observaciones.trim();

    setConfirmacionPago({
      pagoId: pagoDestino.id,
      titularNombreCompleto: `${selectedTitular.nombreContacto} ${selectedTitular.apellido}`.trim(),
      monto: montoNumber,
      medioPago,
      observaciones: trimmedObservaciones ? trimmedObservaciones : undefined,
      fechaPagoIso,
      periodoDestino: pagoDestino.periodo,
    });
    setIsConfirmOpen(true);
  };

  const handleConfirmarPago = async () => {
    if (!confirmacionPago) {
      return;
    }

    try {
      await registrarPago.mutateAsync({
        id: confirmacionPago.pagoId,
        data: {
          monto: confirmacionPago.monto,
          fechaPago: confirmacionPago.fechaPagoIso,
          medioPago: confirmacionPago.medioPago,
          observaciones: confirmacionPago.observaciones,
        },
      });
      showSuccess('Pago registrado correctamente');
      closeConfirmacionModal();
      resetState();
      onClose();
      onSuccess();
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'No se pudo registrar el pago';
      showError(errorMessage);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPageNumber(1);
  };

  const handleTitularSelect = (titular: TitularResponse) => {
    setSelectedTitular(titular);
  };

  const renderTitulares = () => {
    if (isLoadingTitulares && !titulares.length) {
      return (
        <div className="flex h-40 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          <span className="material-symbols-outlined mr-2 animate-spin text-[20px] text-[#1d8ca5]">progress_activity</span>
          Cargando titulares con cuotas generadas...
        </div>
      );
    }

    if (hasTitularesError) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-transparent dark:text-gray-400">
          {titularesError && typeof titularesError === 'object' && 'message' in titularesError
            ? String(titularesError.message)
            : 'No se pudieron cargar los titulares. Intentá nuevamente en unos segundos.'}
        </div>
      );
    }

    if (!titulares.length) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-transparent dark:text-gray-400">
          {trimmedSearch
            ? 'No hay resultados para tu búsqueda.'
            : 'No hay titulares con cuotas generadas.'}
        </div>
      );
    }

    return (
      <>
        <div className="mt-4 flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
          {titulares.map((titular) => {
            const isSelected = titular.id === selectedTitularId;
            return (
              <button
                key={titular.id}
                type="button"
                onClick={() => handleTitularSelect(titular)}
                className={`${titularButtonBaseClasses} ${
                  isSelected
                    ? 'border-[#1d8ca5] bg-white text-[#0f181a] dark:bg-[#fdfcfb]/10 dark:text-white'
                    : 'border-gray-200 bg-white text-gray-900 hover:border-[#1d8ca5]/70 dark:border-[#3f3f46] dark:bg-[#1f1f24] dark:text-gray-100'
                }`}
                aria-pressed={isSelected}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{titular.apellido}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{titular.nombreContacto}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Cuota</p>
                    <p className="text-sm font-semibold text-[#1d8ca5]">{formatCurrency(titular.montoMensualPactado)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-col gap-2 text-xs text-gray-500 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Mostrando <span className="font-semibold text-gray-900 dark:text-gray-100">{startItem}</span> -{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{endItem}</span> de{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{totalCount}</span> titulares con cuotas generadas registrados
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
              disabled={!hasPreviousPage}
              className="inline-flex items-center gap-1 rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:border-[#1d8ca5]/70 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3f3f46] dark:bg-[#1f1f24] dark:text-gray-200"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPageNumber((prev) => prev + 1)}
              disabled={!hasNextPage}
              className="inline-flex items-center gap-1 rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:border-[#1d8ca5]/70 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3f3f46] dark:bg-[#1f1f24] dark:text-gray-200"
            >
              Siguiente
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderResumen = () => {
    if (!selectedTitular) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Seleccioná un titular para consultar sus cuotas pendientes y registrar un pago manual.
        </p>
      );
    }

    if (isLoadingPagos || isFetchingPagos) {
      return (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="material-symbols-outlined animate-spin text-[20px] text-[#1d8ca5]">progress_activity</span>
          Cargando cuotas generadas...
        </div>
      );
    }

    if (!tieneCuotas) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Este titular todavía no tiene cuotas generadas. Generá las cuotas antes de registrar un pago.
        </p>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[#3f3f46] dark:bg-[#1f1f24]">
          <p className="text-xs uppercase tracking-wide text-gray-400">Cuota mensual</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
            {formatCurrency(selectedTitular.montoMensualPactado)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[#3f3f46] dark:bg-[#1f1f24]">
          <p className="text-xs uppercase tracking-wide text-gray-400">Saldo total pendiente</p>
          <p className="mt-1 text-xl font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(saldoTotalPendiente)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[#3f3f46] dark:bg-[#1f1f24]">
          <p className="text-xs uppercase tracking-wide text-gray-400">Cuotas con deuda</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{cuotasConDeuda.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[#3f3f46] dark:bg-[#1f1f24]">
          <p className="text-xs uppercase tracking-wide text-gray-400">Próximo vencimiento</p>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
            {proximoVencimientoLabel}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar pago manual" maxWidth="2xl">
      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] xl:gap-8">
        <div className="rounded-3xl border border-gray-200 bg-gray-50/70 p-4 dark:border-[#3f3f46] dark:bg-[#1f1f24]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#1d8ca5]">Paso 1</p>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Seleccioná al titular</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                El listado muestra solo titulares con cuotas generadas.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>10 por página</span>
              {isFetchingTitulares && !isLoadingTitulares && (
                <span className="flex items-center gap-1 text-[#1d8ca5]">
                  <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  Actualizando
                </span>
              )}
            </div>
          </div>
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar por apellido o nombre..."
            className="mt-4"
          />
          {renderTitulares()}
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 dark:border-[#3f3f46] dark:bg-[#1f1f24]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#1d8ca5]">Paso 2</p>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Resumen y registro</h3>
            </div>
            {selectedTitular && (
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wide text-gray-400">Titular</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTitular.apellido}</p>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-4">
            {renderResumen()}

            <form onSubmit={handleSubmit} className="space-y-4" aria-disabled={!selectedTitular}>
              <div>
                <label htmlFor="monto" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Monto a registrar <span className="text-red-500">*</span>
                </label>
                <input
                  id="monto"
                  type="number"
                  min="0"
                  step="0.01"
                  value={monto}
                  onChange={(event) => setMonto(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1d8ca5] disabled:bg-gray-100 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white"
                  inputMode="decimal"
                  disabled={!selectedTitular || registrarPago.isPending}
                />
                {!isMontoValid && monto.trim() !== '' && (
                  <p className="mt-1 text-xs text-red-500">Ingresá un monto válido mayor a cero.</p>
                )}
              </div>

              <div>
                <label htmlFor="medioPago" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Medio de pago
                </label>
                <select
                  id="medioPago"
                  value={medioPago}
                  onChange={(event) => setMedioPago(event.target.value as MedioPago)}
                  className="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1d8ca5] disabled:bg-gray-100 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white"
                  disabled={!selectedTitular || registrarPago.isPending}
                >
                  {Object.values(MEDIOS_PAGO).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="observaciones" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Observaciones (opcional)
                </label>
                <textarea
                  id="observaciones"
                  rows={3}
                  value={observaciones}
                  onChange={(event) => setObservaciones(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1d8ca5] disabled:bg-gray-100 dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white"
                  placeholder="Notas internas, referencia de transferencia, etc."
                  disabled={registrarPago.isPending}
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={registrarPago.isPending}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  variant="brand"
                  className="w-full rounded-full sm:w-auto"
                >
                  {registrarPago.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-[20px] text-white">progress_activity</span>
                      Registrando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">task_alt</span>
                      Registrar pago
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Modal
        isOpen={isConfirmOpen && Boolean(confirmacionPago)}
        onClose={handleConfirmacionClose}
        title="¿Querés confirmar el pago?"
        maxWidth="lg"
      >
        {confirmacionPago && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white/80 p-5 text-sm text-gray-700 dark:border-[#3f3f46] dark:bg-[#1f1f24] dark:text-gray-200">
              <dl className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-gray-500 dark:text-gray-400">Titular</dt>
                  <dd className="text-right font-semibold text-gray-900 dark:text-white">
                    {confirmacionPago.titularNombreCompleto}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-gray-500 dark:text-gray-400">Cuota destino</dt>
                  <dd className="text-right font-semibold text-gray-900 dark:text-white">
                    {confirmacionPago.periodoDestino}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-gray-500 dark:text-gray-400">Monto</dt>
                  <dd className="text-right font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(confirmacionPago.monto)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-gray-500 dark:text-gray-400">Medio de pago</dt>
                  <dd className="text-right font-semibold text-gray-900 dark:text-white">
                    {confirmacionPago.medioPago}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-gray-500 dark:text-gray-400">Fecha de registro</dt>
                  <dd className="text-right font-semibold text-gray-900 dark:text-white">
                    {formatDateTime(confirmacionPago.fechaPagoIso)}
                  </dd>
                </div>
              </dl>
            </div>

            {confirmacionPago.observaciones && (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white/70 p-4 text-sm text-gray-700 dark:border-[#3f3f46] dark:bg-[#1f1f24] dark:text-gray-200">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Observaciones</p>
                <p className="mt-1 whitespace-pre-line text-sm">{confirmacionPago.observaciones}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={handleConfirmacionClose}
                disabled={registrarPago.isPending}
                className="w-full sm:w-auto"
              >
                Volver
              </Button>
              <Button
                type="button"
                onClick={handleConfirmarPago}
                disabled={registrarPago.isPending}
                variant="brand"
                className="w-full rounded-full sm:w-auto"
              >
                {registrarPago.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-[20px] text-white">progress_activity</span>
                    Confirmando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">task_alt</span>
                    Confirmar pago
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Modal>
  );
};
