import { useState } from 'react';
import { useToast } from '../../shared/hooks/useToast';
import { useMarkTitularTelefonoPrincipal, useTitularTelefonos } from '../services/titulares.queries';
import { buildWhatsappUrl, getPrincipalTelefono } from '../helpers/phone.helpers';

/**
 * Teléfonos de un titular: listado, marcado del principal y acceso a WhatsApp
 * con el teléfono principal.
 */
export const useTitularPhones = (titularId?: number) => {
  const { data: telefonos, isLoading, error, refetch } = useTitularTelefonos(titularId);
  const { mutateAsync: markTelefonoPrincipal } = useMarkTitularTelefonoPrincipal(titularId ?? 0);
  const [markingPhoneId, setMarkingPhoneId] = useState<number | null>(null);
  const { showSuccess, showError } = useToast();

  const principalPhone = getPrincipalTelefono(telefonos);
  const whatsappUrl = buildWhatsappUrl(principalPhone?.numeroE164);

  const markPrincipal = async (telefonoId: number) => {
    if (!titularId) return;

    try {
      setMarkingPhoneId(telefonoId);
      await markTelefonoPrincipal(telefonoId);
      showSuccess('Teléfono marcado como principal');
    } catch (markError) {
      console.error('Error al marcar teléfono principal', markError);
      showError('No se pudo marcar el teléfono como principal');
    } finally {
      setMarkingPhoneId(null);
    }
  };

  const openWhatsapp = () => {
    if (!whatsappUrl) {
      showError('No hay un teléfono principal activo para WhatsApp');
      return;
    }
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return {
    telefonos,
    isLoading,
    hasError: Boolean(error),
    refetch,
    principalPhone,
    whatsappDisabled: isLoading || !whatsappUrl,
    markingPhoneId,
    markPrincipal,
    openWhatsapp,
  };
};
