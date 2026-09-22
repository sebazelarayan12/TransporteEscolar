import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let configurado = false;

/**
 * Arregla el bug clásico de Leaflet con bundlers: las rutas de los íconos por defecto
 * están hardcodeadas y Vite no las resuelve, así que los marcadores salen invisibles.
 * La solución es importar las imágenes para que Vite les ponga hash y registrarlas a mano.
 *
 * Es idempotente: se puede llamar desde varios componentes sin efectos secundarios.
 */
export const configurarIconosLeaflet = (): void => {
  if (configurado) {
    return;
  }

  // Esta propiedad interna es la que guarda las rutas rotas. Hay que borrarla
  // antes de aplicar las nuestras, si no Leaflet las vuelve a calcular.
  delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
  });

  configurado = true;
};
