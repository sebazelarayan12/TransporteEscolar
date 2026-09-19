import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { Marker as LeafletMarker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { configurarIconosLeaflet } from './leaflet-setup';
import {
  TILE_ATRIBUCION,
  TILE_URL,
  TUCUMAN_CENTRO,
  ZOOM_DETALLE,
  ZOOM_POR_DEFECTO,
} from '../utils/geo.helpers';

configurarIconosLeaflet();

export interface PuntoMapa {
  lat: number;
  lng: number;
}

export interface MarcadorSecundario {
  id: number;
  nombre: string;
  punto: PuntoMapa;
}

export interface MapaUbicacionProps {
  /** Coordenada actual del pin, o null si todavía no se marcó. */
  valor: PuntoMapa | null;
  /** Se dispara al hacer clic en el mapa o al soltar el pin arrastrado. */
  onChange: (punto: PuntoMapa) => void;
  /** Marcadores fijos que solo se muestran, como los colegios. */
  marcadoresSecundarios?: MarcadorSecundario[];
  /** Clase de Tailwind con la altura. Leaflet necesita altura explícita o no renderiza. */
  alturaClassName?: string;
  /** Si es true, el pin no se puede mover y el mapa no responde a clics. */
  soloLectura?: boolean;
}

/** Centra el mapa cuando cambia el punto que viene desde afuera, por ejemplo al elegir del buscador. */
const CentradorDeMapa = ({ punto }: { punto: PuntoMapa | null }) => {
  const mapa = useMap();

  useEffect(() => {
    if (!punto) {
      return;
    }

    mapa.setView([punto.lat, punto.lng], ZOOM_DETALLE);
  }, [mapa, punto]);

  return null;
};

/** Traduce los clics sobre el mapa en cambios de coordenada. */
const CapturadorDeClics = ({
  onChange,
  deshabilitado,
}: {
  onChange: (punto: PuntoMapa) => void;
  deshabilitado: boolean;
}) => {
  useMapEvents({
    click: (evento) => {
      if (deshabilitado) {
        return;
      }

      onChange({ lat: evento.latlng.lat, lng: evento.latlng.lng });
    },
  });

  return null;
};

/**
 * Mapa con un pin que el usuario puede arrastrar hasta la casa exacta.
 *
 * El pin manual es deliberado: la numeración de calles en Yerba Buena está
 * incompleta en OpenStreetMap, así que el buscador solo propone y la persona confirma.
 */
export const MapaUbicacion = ({
  valor,
  onChange,
  marcadoresSecundarios = [],
  alturaClassName = 'h-80',
  soloLectura = false,
}: MapaUbicacionProps) => {
  const marcadorRef = useRef<LeafletMarker | null>(null);
  const [centroInicial] = useState<PuntoMapa>(() => valor ?? TUCUMAN_CENTRO);

  const zoomInicial = valor ? ZOOM_DETALLE : ZOOM_POR_DEFECTO;

  return (
    <div className={`w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 ${alturaClassName}`}>
      <MapContainer
        center={[centroInicial.lat, centroInicial.lng]}
        zoom={zoomInicial}
        scrollWheelZoom={!soloLectura}
        className="h-full w-full"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATRIBUCION} />

        <CentradorDeMapa punto={valor} />
        <CapturadorDeClics onChange={onChange} deshabilitado={soloLectura} />

        {valor ? (
          <Marker
            position={[valor.lat, valor.lng]}
            draggable={!soloLectura}
            ref={marcadorRef}
            eventHandlers={{
              dragend: () => {
                const posicion = marcadorRef.current?.getLatLng();

                if (posicion) {
                  onChange({ lat: posicion.lat, lng: posicion.lng });
                }
              },
            }}
          >
            <Popup>
              {soloLectura ? 'Ubicación de la casa' : 'Arrastrá el pin hasta la casa exacta'}
            </Popup>
          </Marker>
        ) : null}

        {marcadoresSecundarios.map((marcador) => (
          <Marker key={marcador.id} position={[marcador.punto.lat, marcador.punto.lng]} opacity={0.7}>
            <Popup>{marcador.nombre}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
