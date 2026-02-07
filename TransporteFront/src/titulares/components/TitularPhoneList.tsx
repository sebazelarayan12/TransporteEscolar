import { SectionHeader, Spinner, Alert } from '../../shared/ui';
import { useToast } from '../../shared/hooks';
import type { TitularTelefonoResponse } from '../types/titular.types';

interface TitularPhoneListProps {
  phones?: TitularTelefonoResponse[];
  isLoading: boolean;
  error?: string;
  onRetry?: () => void;
  showHeader?: boolean;
  titularNombre?: string;
}

const formatPhoneNumber = (numero: string) => {
  if (!numero) return '-';
  const normalized = numero.replace(/\s+/g, '');
  if (!/^\+?\d+$/.test(normalized)) {
    return numero;
  }

  const withoutPrefix = normalized.startsWith('+') ? normalized.slice(1) : normalized;
  if (withoutPrefix.length <= 6) {
    return numero;
  }

  const country = normalized.startsWith('+') ? `+${withoutPrefix.slice(0, 2)}` : withoutPrefix.slice(0, 2);
  const rest = withoutPrefix.slice(2);
  const middle = rest.slice(0, Math.max(2, rest.length - 4));
  const last = rest.slice(-4);
  return `${country} ${middle} ${last}`.trim();
};

export const TitularPhoneList = ({ phones, isLoading, error, onRetry, showHeader = true, titularNombre }: TitularPhoneListProps) => {
  const { showSuccess, showError } = useToast();
  const whatsappMessageName = encodeURIComponent(titularNombre?.trim() || 'Titular');

  const handleCopyNumber = async (numeroE164?: string) => {
    if (!numeroE164 || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      console.error('Clipboard API no disponible');
      showError('No se pudo copiar el número');
      return;
    }

    try {
      await navigator.clipboard.writeText(numeroE164);
      showSuccess('Número copiado al portapapeles');
    } catch (error) {
      console.error('Error al copiar el número', error);
      showError('No se pudo copiar el número');
    }
  };

  const buildWhatsappUrl = (numeroE164?: string) => {
    if (!numeroE164) return null;
    const digits = numeroE164.replace(/\D/g, '');
    if (!digits) return null;
    return `https://wa.me/${digits}?text=Hola%20${whatsappMessageName}`;
  };

  const handleWhatsappClick = (numeroE164?: string) => {
    const url = buildWhatsappUrl(numeroE164);
    if (!url || typeof window === 'undefined') {
      return;
    }
    window.open(url, '_blank', 'noreferrer');
  };

  const hasPhones = (phones?.length ?? 0) > 0;

  return (
    <section>
      {showHeader && (
        <SectionHeader 
          icon="perm_phone_msg" 
          title="Teléfonos"
          action={{ label: 'Agregar', onClick: () => console.log('Add phone') }}
        />
      )}
      <div className="space-y-2 min-h-[120px]">
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Spinner size="sm" />
          </div>
        )}

        {!isLoading && error && (
          <Alert variant="error" className="text-xs sm:text-sm">
            <div className="flex flex-col gap-2">
              <span>No se pudieron cargar los teléfonos.</span>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="self-start text-xs font-bold text-[#007a8a] hover:text-[#00626e]"
                >
                  Reintentar
                </button>
              )}
            </div>
          </Alert>
        )}

        {!isLoading && !error && !hasPhones && (
          <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-center text-sm text-gray-500">
            Este titular no tiene teléfonos registrados.
          </div>
        )}

        {!isLoading && !error && hasPhones && (
          <>
          {phones!.map((phone) => (
            <div 
              key={phone.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-[#e4e4e7] dark:border-[#3f3f46] hover:border-[#007a8a]/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`size-8 rounded-full flex items-center justify-center ${
                  phone.esPrincipal
                    ? 'bg-[#007a8a]/10 text-[#007a8a]'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {phone.esPrincipal ? 'call' : 'home'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                    {formatPhoneNumber(phone.numeroE164)}
                  </span>
                  <span className={`text-[10px] uppercase tracking-wide ${
                    phone.esPrincipal
                      ? 'font-semibold text-[#007a8a]'
                      : 'font-medium text-gray-400'
                  }`}>
                    {phone.esPrincipal ? 'Principal' : 'Alternativo'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-gray-400 dark:text-gray-300">
                <button
                  type="button"
                  onClick={() => handleCopyNumber(phone.numeroE164)}
                  aria-label="Copiar número"
                  title="Copiar número"
                  className="p-1.5 text-gray-400 dark:text-gray-300 hover:text-[#007a8a] rounded hover:bg-white dark:hover:bg-white/10"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleWhatsappClick(phone.numeroE164)}
                  aria-label="Abrir WhatsApp"
                  title="Abrir WhatsApp"
                  disabled={!phone.activo || !buildWhatsappUrl(phone.numeroE164)}
                  className="p-1.5 rounded text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/10 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:hover:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[16px]">call</span>
                </button>
                <button
                  type="button"
                  aria-label="Editar teléfono"
                  title="Editar"
                  className="p-1.5 text-gray-400 dark:text-gray-300 hover:text-[#007a8a] rounded hover:bg-white dark:hover:bg-white/10"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
                {phone.activo && !phone.esPrincipal && (
                  <button
                    type="button"
                    aria-label="Eliminar teléfono"
                    title="Eliminar teléfono"
                    className="p-1.5 text-gray-400 dark:text-gray-300 hover:text-red-500 rounded hover:bg-white dark:hover:bg-white/10"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          </>
        )}
      </div>
    </section>
  );
};
