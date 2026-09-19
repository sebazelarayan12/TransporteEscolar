#!/usr/bin/env bash
# Prepara el grafo de ruteo de Tucumán para OSRM (algoritmo MLD, perfil auto).
#
# Uso:
#   ./preparar-datos.sh [directorio-de-datos]      (por defecto: /opt/osrm-datos)
#   ./preparar-datos.sh --help
#
# Se corre UNA vez en el VPS y después solo si se quiere actualizar el mapa
# (es idempotente: volver a correrlo descarga de nuevo y sobrescribe todo).
# Requiere: docker, curl y ~3 GB libres en el directorio de datos.
# Tarda unos minutos y es la única parte que consume RAM de verdad (~2 GB libres).
set -euo pipefail

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  sed -n '2,11p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
  exit 0
fi

DIRECTORIO_DATOS="${1:-/opt/osrm-datos}"
REGION="tucuman"

# Recuadro que cubre Tucumán y Yerba Buena: minlon,minlat,maxlon,maxlat (sin espacios).
BBOX="-66.2,-28.1,-64.4,-25.9"

URL_ARGENTINA="https://download.geofabrik.de/south-america/argentina-latest.osm.pbf"
IMAGEN_OSRM="ghcr.io/project-osrm/osrm-backend:latest"
ESPACIO_MINIMO_KB=$((3 * 1024 * 1024))

# --- Validaciones previas -----------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker no está instalado o no está en el PATH." >&2
  exit 1
fi
if ! command -v curl >/dev/null 2>&1; then
  echo "ERROR: curl no está instalado o no está en el PATH." >&2
  exit 1
fi

echo "==> Carpeta de datos: ${DIRECTORIO_DATOS}"
mkdir -p "${DIRECTORIO_DATOS}"
# Ruta absoluta: docker exige rutas absolutas en -v.
DIRECTORIO_DATOS="$(cd "${DIRECTORIO_DATOS}" && pwd)"
cd "${DIRECTORIO_DATOS}"

LIBRE_KB="$(df -Pk . | awk 'NR==2 {print $4}')"
if [[ "${LIBRE_KB}" -lt "${ESPACIO_MINIMO_KB}" ]]; then
  echo "ERROR: hay $((LIBRE_KB / 1024)) MB libres en ${DIRECTORIO_DATOS} y hacen falta al menos $((ESPACIO_MINIMO_KB / 1024)) MB." >&2
  exit 1
fi

# --- Descarga y recorte -------------------------------------------------------
echo "==> Descargando el extracto de Argentina (~430 MB)"
curl -L --fail --retry 3 -o argentina.osm.pbf "${URL_ARGENTINA}"

# La imagen de osmium-tool no existe en ningún registro público: se usa el paquete
# oficial de Debian en un contenedor efímero.
echo "==> Recortando a Tucumán (bbox ${BBOX})"
docker run --rm -v "${DIRECTORIO_DATOS}:/data" debian:bookworm-slim bash -c \
  "apt-get update -qq && apt-get install -y -qq --no-install-recommends osmium-tool >/dev/null && \
   osmium extract --bbox ${BBOX} --overwrite -o /data/${REGION}.osm.pbf /data/argentina.osm.pbf"

echo "==> Tamaño del recorte:"
ls -lh "${REGION}.osm.pbf"

echo "==> Liberando el extracto completo, ya no hace falta"
rm -f argentina.osm.pbf

# --- Preprocesado OSRM (MLD) --------------------------------------------------
# Las tres etapas se corren en este orden y no se pueden saltear.
# Se borran los .osrm* de una corrida anterior para no mezclar generaciones de datos.
rm -f "${REGION}".osrm*

echo "==> osrm-extract (perfil auto)"
docker run --rm -v "${DIRECTORIO_DATOS}:/data" "${IMAGEN_OSRM}" \
  osrm-extract -p /opt/car.lua "/data/${REGION}.osm.pbf"

echo "==> osrm-partition"
docker run --rm -v "${DIRECTORIO_DATOS}:/data" "${IMAGEN_OSRM}" \
  osrm-partition "/data/${REGION}.osrm"

echo "==> osrm-customize"
docker run --rm -v "${DIRECTORIO_DATOS}:/data" "${IMAGEN_OSRM}" \
  osrm-customize "/data/${REGION}.osrm"

# --- Resumen ------------------------------------------------------------------
echo "==> Listo. Archivos generados:"
ls -lh "${REGION}".osrm*
echo "==> Total de los archivos .osrm*:"
du -ch "${REGION}".osrm* | tail -n 1

echo
echo "Siguiente paso:"
echo "  - Primera vez: desplegar infra/osrm/docker-compose.yml como aplicación Compose en Dokploy."
echo "  - Si estás actualizando el mapa: reiniciar/redeployar el servicio osrm-tucuman en Dokploy."
echo "  Detalle en infra/osrm/README.md."
