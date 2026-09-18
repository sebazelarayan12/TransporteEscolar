/**
 * RegistrarPagoModal
 * Orquesta el flujo de registro manual de pago; la lógica vive en useRegistrarPagoModal.
 */

import { Modal } from '../../shared/ui/Modal';
import { TITULARES_PAGE_SIZE, useRegistrarPagoModal } from '../hooks/useRegistrarPagoModal';
import { TitularSelector } from './registrar-pago/TitularSelector';
import { ResumenTitular } from './registrar-pago/ResumenTitular';
import { FormularioRegistroPago } from './registrar-pago/FormularioRegistroPago';
import { ConfirmacionPagoModal } from './registrar-pago/ConfirmacionPagoModal';
import { AjustarMontoTitularModal } from './AjustarMontoTitularModal';

interface RegistrarPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegistrarPagoModal = ({ isOpen, onClose, onSuccess }: RegistrarPagoModalProps) => {
  const flow = useRegistrarPagoModal({ isOpen, onClose, onSuccess });
  const { state, titularActivo, titularesQuery, pagosQuery } = flow;

  return (
    <>
      <Modal isOpen={isOpen} onClose={flow.close} title="Registrar pago manual" maxWidth="2xl">
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] xl:gap-8">
          {/* Left column: Titular selection */}
          <TitularSelector
            titulares={flow.titulares}
            selectedTitularId={state.selectedTitular?.id ?? null}
            search={state.search}
            onSearchChange={state.setSearch}
            onTitularSelect={state.selectTitular}
            pageNumber={state.pageNumber}
            onPageChange={state.setPageNumber}
            totalCount={flow.totalCount}
            pageSize={TITULARES_PAGE_SIZE}
            isLoading={titularesQuery.isLoading}
            isFetching={titularesQuery.isFetching}
            isError={titularesQuery.isError}
            error={titularesQuery.error}
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
                pagosTitular={pagosQuery.data}
                isLoading={pagosQuery.isLoading}
                isFetching={pagosQuery.isFetching}
                onAdjustMonto={titularActivo ? flow.openAdjustMonto : undefined}
              />

              <FormularioRegistroPago
                monto={state.monto}
                onMontoChange={state.setMonto}
                medioPago={state.medioPago}
                onMedioPagoChange={state.setMedioPago}
                observaciones={state.observaciones}
                onObservacionesChange={state.setObservaciones}
                onSubmit={flow.submit}
                onCancel={flow.close}
                canSubmit={flow.canSubmit}
                isPending={flow.isRegistrando}
                disabled={!titularActivo}
              />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmacionPagoModal
        isOpen={state.isConfirmOpen && Boolean(state.confirmacionPago)}
        onClose={flow.closeConfirmacion}
        onConfirm={flow.confirmarPago}
        data={state.confirmacionPago}
        isPending={flow.isRegistrando}
      />

      <AjustarMontoTitularModal
        key={`${titularActivo?.id ?? 'none'}-${state.isAdjustModalOpen ? 'open' : 'closed'}`}
        isOpen={state.isAdjustModalOpen && Boolean(titularActivo)}
        onClose={() => state.setAdjustModalOpen(false)}
        titular={titularActivo}
      />
    </>
  );
};
