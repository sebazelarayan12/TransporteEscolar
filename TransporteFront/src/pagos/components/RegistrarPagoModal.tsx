/**
 * RegistrarPagoModal (Refactored)
 * Main orchestrator for payment registration flow
 * Now uses extracted components for better maintainability
 */

import { useReducer } from 'react';
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

interface RegistrarPagoState {
  search: string;
  pageNumber: number;
  selectedTitular: TitularResponse | null;
  monto: string;
  medioPago: MedioPago;
  observaciones: string;
  isAdjustModalOpen: boolean;
  isConfirmOpen: boolean;
  confirmacionPago: PagoConfirmacionData | null;
}

type RegistrarPagoAction =
  | { type: 'setSearch'; payload: string }
  | { type: 'setPageNumber'; payload: number }
  | { type: 'selectTitular'; payload: TitularResponse | null }
  | { type: 'setMonto'; payload: string }
  | { type: 'setMedioPago'; payload: MedioPago }
  | { type: 'setObservaciones'; payload: string }
  | { type: 'setAdjustModalOpen'; payload: boolean }
  | { type: 'openConfirmacion'; payload: PagoConfirmacionData }
  | { type: 'closeConfirmacion' }
  | { type: 'reset' };

const registrarPagoInitialState: RegistrarPagoState = {
  search: '',
  pageNumber: 1,
  selectedTitular: null,
  monto: '',
  medioPago: MEDIOS_PAGO.EFECTIVO,
  observaciones: '',
  isAdjustModalOpen: false,
  isConfirmOpen: false,
  confirmacionPago: null,
};

const registrarPagoReducer = (state: RegistrarPagoState, action: RegistrarPagoAction): RegistrarPagoState => {
  switch (action.type) {
    case 'setSearch':
      return { ...state, search: action.payload, pageNumber: 1 };
    case 'setPageNumber':
      return { ...state, pageNumber: action.payload };
    case 'selectTitular':
      return { ...state, selectedTitular: action.payload, isAdjustModalOpen: false };
    case 'setMonto':
      return { ...state, monto: action.payload };
    case 'setMedioPago':
      return { ...state, medioPago: action.payload };
    case 'setObservaciones':
      return { ...state, observaciones: action.payload };
    case 'setAdjustModalOpen':
      return { ...state, isAdjustModalOpen: action.payload };
    case 'openConfirmacion':
      return { ...state, confirmacionPago: action.payload, isConfirmOpen: true };
    case 'closeConfirmacion':
      return { ...state, confirmacionPago: null, isConfirmOpen: false };
    case 'reset':
      return { ...registrarPagoInitialState };
    default:
      return state;
  }
};

interface RegistrarPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegistrarPagoModal = ({ isOpen, onClose, onSuccess }: RegistrarPagoModalProps) => {
  const [state, dispatch] = useReducer(registrarPagoReducer, registrarPagoInitialState);
  const {
    search,
    pageNumber,
    selectedTitular,
    monto,
    medioPago,
    observaciones,
    isAdjustModalOpen,
    isConfirmOpen,
    confirmacionPago,
  } = state;

  const debouncedSearch = useDebounce(search, 300);
  const trimmedSearch = debouncedSearch.trim();
  const pageSize = 10;
  const selectedTitularId = selectedTitular?.id ?? null;

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
  const ajustarModalKey = `${titularActivo?.id ?? 'none'}-${isAdjustModalOpen ? 'open' : 'closed'}`;

  // Handlers
  const resetState = () => {
    dispatch({ type: 'reset' });
  };

  const closeConfirmacionModal = () => {
    dispatch({ type: 'closeConfirmacion' });
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
    dispatch({ type: 'setSearch', payload: value });
  };

  const handleTitularSelect = (titular: TitularResponse) => {
    dispatch({ type: 'selectTitular', payload: titular });
  };

  const handleAdjustMontoClick = () => {
    if (!titularActivo) {
      return;
    }
    dispatch({ type: 'setAdjustModalOpen', payload: true });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const pagoDestino = pagosOrdenados[0];
    if (!titularActivo || !pagoDestino || !isMontoValid) {
      return;
    }

    const fechaPagoIso = new Date().toISOString();
    const trimmedObservaciones = observaciones.trim();

    dispatch({
      type: 'openConfirmacion',
      payload: {
        pagoId: pagoDestino.id,
        titularNombreCompleto: `${titularActivo.nombreContacto} ${titularActivo.apellido}`.trim(),
        monto: montoNumber,
        medioPago,
        observaciones: trimmedObservaciones ? trimmedObservaciones : undefined,
        fechaPagoIso,
        periodoDestino: pagoDestino.periodo,
      },
    });
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
            onPageChange={(value) => dispatch({ type: 'setPageNumber', payload: value })}
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
                onMontoChange={(value) => dispatch({ type: 'setMonto', payload: value })}
                medioPago={medioPago}
                onMedioPagoChange={(value) => dispatch({ type: 'setMedioPago', payload: value })}
                observaciones={observaciones}
                onObservacionesChange={(value) =>
                  dispatch({ type: 'setObservaciones', payload: value })
                }
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
        key={ajustarModalKey}
        isOpen={isAdjustModalOpen && Boolean(titularActivo)}
        onClose={() => dispatch({ type: 'setAdjustModalOpen', payload: false })}
        titular={titularActivo}
      />
    </>
  );
};
