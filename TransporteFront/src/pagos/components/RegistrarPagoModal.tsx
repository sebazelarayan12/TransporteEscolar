/**
 * RegistrarPagoModal (Refactored)
 * Main orchestrator for payment registration flow
 * Now uses extracted components for better maintainability
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../../shared/ui';
import { usePagosPorTitular, useRegistrarPago, useTitularesConPagos } from '../services/pagos.queries';
import { useToast } from '../../shared/hooks/useToast';
import { useDebounce } from '../../shared/hooks/useDebounce';
import type { TitularResponse } from '../../titulares/types/titular.types';
import { MEDIOS_PAGO, type MedioPago } from '../constants/medios-pago.constants';
import { ordenarPagosPorPeriodo } from '../helpers/saldo.helpers';
import {
  TitularSelector,
  ResumenTitular,
  FormularioRegistroPago,
  ConfirmacionPagoModal,
  type PagoConfirmacionData,
} from './registrar-pago';
import { AjustarMontoTitularModal } from './AjustarMontoTitularModal';

interface RegistrarPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegistrarPagoModal = ({ isOpen, onClose, onSuccess }: RegistrarPagoModalProps) => {
  // Search & Pagination state
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const trimmedSearch = debouncedSearch.trim();
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  // Selected titular and form state
  const [selectedTitular, setSelectedTitular] = useState<TitularResponse | null>(null);
  const selectedTitularId = selectedTitular?.id ?? null;
  const [monto, setMonto] = useState('');
  const [medioPago, setMedioPago] = useState<MedioPago>(MEDIOS_PAGO.EFECTIVO);
  const [observaciones, setObservaciones] = useState('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Confirmation modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmacionPago, setConfirmacionPago] = useState<PagoConfirmacionData | null>(null);

  // Queries and mutations
  const {
    data: titularesResponse,
    isLoading: isLoadingTitulares,
    isError: hasTitularesError,
    error: titularesError,
    isFetching: isFetchingTitulares,
  } = useTitularesConPagos(trimmedSearch, pageNumber, pageSize, { enabled: isOpen });

  const {
    data: pagosTitular,
    isFetching: isFetchingPagos,
    isLoading: isLoadingPagos,
  } = usePagosPorTitular(selectedTitularId);

  const registrarPago = useRegistrarPago();
  const { showSuccess, showError } = useToast();

  // Derived state
  const titulares = titularesResponse?.data ?? [];
  const totalCount = titularesResponse?.totalCount ?? 0;
  const pagosOrdenados = ordenarPagosPorPeriodo(pagosTitular ?? []);
  const montoNumber = parseFloat(monto);
  const isMontoValid = monto.trim() !== '' && Number.isFinite(montoNumber) && montoNumber > 0;
  const tieneCuotas = pagosOrdenados.length > 0;
  const titularActivo = selectedTitular
    ? titulares.find((titular) => titular.id === selectedTitular.id) ?? selectedTitular
    : null;
  const canSubmit = Boolean(titularActivo && tieneCuotas && isMontoValid) && !registrarPago.isPending;

  // Handlers
  const resetState = () => {
    setSearch('');
    setPageNumber(1);
    setSelectedTitular(null);
    setMonto('');
    setMedioPago(MEDIOS_PAGO.EFECTIVO);
    setObservaciones('');
    setIsAdjustModalOpen(false);
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

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPageNumber(1);
  };

  const handleTitularSelect = (titular: TitularResponse) => {
    setSelectedTitular(titular);
    setIsAdjustModalOpen(false);
  };

  const handleAdjustMontoClick = () => {
    if (!titularActivo) {
      return;
    }
    setIsAdjustModalOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const pagoDestino = pagosOrdenados[0];
    if (!titularActivo || !pagoDestino || !isMontoValid) {
      return;
    }

    const fechaPagoIso = new Date().toISOString();
    const trimmedObservaciones = observaciones.trim();

    setConfirmacionPago({
      pagoId: pagoDestino.id,
      titularNombreCompleto: `${titularActivo.nombreContacto} ${titularActivo.apellido}`.trim(),
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

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Registrar pago manual" maxWidth="2xl">
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] xl:gap-8">
          {/* Left column: Titular selection */}
          <TitularSelector
            titulares={titulares}
            selectedTitularId={selectedTitularId}
            search={search}
            onSearchChange={handleSearchChange}
            onTitularSelect={handleTitularSelect}
            pageNumber={pageNumber}
            onPageChange={setPageNumber}
            totalCount={totalCount}
            pageSize={pageSize}
            isLoading={isLoadingTitulares}
            isFetching={isFetchingTitulares}
            isError={hasTitularesError}
            error={titularesError}
          />

          {/* Right column: Summary and form */}
          <div className="rounded-3xl border border-gray-200 bg-white p-5 dark:border-[#3f3f46] dark:bg-[#1f1f24]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#1d8ca5]">Paso 2</p>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Resumen y registro</h3>
              </div>
              {titularActivo && (
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">Titular</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{titularActivo.apellido}</p>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-4">
              <ResumenTitular
                titular={titularActivo}
                pagosTitular={pagosTitular}
                isLoading={isLoadingPagos}
                isFetching={isFetchingPagos}
                onAdjustMonto={titularActivo ? handleAdjustMontoClick : undefined}
              />

              <FormularioRegistroPago
                monto={monto}
                onMontoChange={setMonto}
                medioPago={medioPago}
                onMedioPagoChange={setMedioPago}
                observaciones={observaciones}
                onObservacionesChange={setObservaciones}
                onSubmit={handleSubmit}
                onCancel={handleClose}
                canSubmit={canSubmit}
                isPending={registrarPago.isPending}
                disabled={!titularActivo}
              />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmacionPagoModal
        isOpen={isConfirmOpen && Boolean(confirmacionPago)}
        onClose={handleConfirmacionClose}
        onConfirm={handleConfirmarPago}
        data={confirmacionPago}
        isPending={registrarPago.isPending}
      />

      <AjustarMontoTitularModal
        isOpen={isAdjustModalOpen && Boolean(titularActivo)}
        onClose={() => setIsAdjustModalOpen(false)}
        titular={titularActivo}
      />
    </>
  );
};
