import type { TitularTelefonoResponse } from '../types/titular.types';

export const DEFAULT_WHATSAPP_MESSAGE = 'Hola, te escribimos del transporte escolar';

export const formatPhoneNumber = (numero?: string) => {
  if (!numero) {
    return '-';
  }

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

export const sanitizePhoneNumber = (numeroE164?: string) => {
  if (!numeroE164) {
    return null;
  }

  const digitsOnly = numeroE164.replace(/\D/g, '');
  return digitsOnly.length ? digitsOnly : null;
};

export const buildWhatsappUrl = (
  numeroE164?: string,
  message: string = DEFAULT_WHATSAPP_MESSAGE,
) => {
  const digits = sanitizePhoneNumber(numeroE164);
  if (!digits) {
    return null;
  }

  const encodedMessage = encodeURIComponent(message.trim());
  return `https://wa.me/${digits}?text=${encodedMessage}`;
};

export const getPrincipalTelefono = (phones?: TitularTelefonoResponse[]) => {
  if (!phones || phones.length === 0) {
    return null;
  }

  return (
    phones.find((phone) => phone.activo && phone.esPrincipal) ??
    phones.find((phone) => phone.activo) ??
    phones[0]
  );
};
