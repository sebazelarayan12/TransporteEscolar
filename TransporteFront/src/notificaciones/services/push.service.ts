import { pushApi } from './push.api';

/**
 * Convierte una clave VAPID base64 a Uint8Array (formato requerido por PushManager)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Convierte un ArrayBuffer a string base64 URL-safe
 */
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Verifica si el navegador soporta push notifications
 */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Obtiene el estado actual del permiso de notificaciones
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

/**
 * Registra el Service Worker y suscribe al usuario para push notifications.
 * Retorna true si se suscribio exitosamente, false si no.
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn('Push notifications no soportadas en este navegador');
    return false;
  }

  try {
    // 1. Pedir permiso al usuario
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('Permiso de notificaciones denegado por el usuario');
      return false;
    }

    // 2. Registrar el Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    // 3. Obtener la clave publica VAPID del backend
    const { publicKey } = await pushApi.getVapidPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // 4. Verificar si ya hay una suscripcion activa
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // 5. Crear nueva suscripcion
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // 6. Enviar la suscripcion al backend
    const p256dh = arrayBufferToBase64(subscription.getKey('p256dh'));
    const auth = arrayBufferToBase64(subscription.getKey('auth'));

    await pushApi.subscribe({
      endpoint: subscription.endpoint,
      p256dh,
      auth,
      userAgent: navigator.userAgent,
    });

    console.info('Suscripcion push registrada exitosamente');
    return true;
  } catch (error) {
    console.error('Error al suscribir push notifications:', error);
    return false;
  }
}

/**
 * Desuscribe al usuario de push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;

    // Desuscribir en el navegador
    await subscription.unsubscribe();

    // Notificar al backend
    await pushApi.unsubscribe({ endpoint: subscription.endpoint });

    console.info('Desuscripcion push completada');
    return true;
  } catch (error) {
    console.error('Error al desuscribir push notifications:', error);
    return false;
  }
}

/**
 * Verifica si el usuario ya esta suscrito a push notifications
 */
export async function isSubscribedToPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;

    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}
