# OSRM self-hosted

Motor de ruteo propio para el cálculo de kilómetros de los recorridos.

El servidor público de OSRM (`router.project-osrm.org`) es un demo: prohíbe el uso
comercial y puede cortar el acceso sin aviso. Este sistema cobra cuotas, así que en
producción el backend tiene que hablar con una instancia propia, en el mismo VPS de
Dokploy. Solo se mapea Tucumán (extracto de OpenStreetMap recortado), por eso el servicio
usa poca memoria y casi nada de CPU en reposo.

## Archivos

| Archivo | Para qué |
|---|---|
| `preparar-datos.sh` | Descarga Argentina, recorta Tucumán y genera el grafo MLD en `/opt/osrm-datos`. |
| `docker-compose.yml` | Servicio `osrm-routed`, sin puertos publicados, en la red `dokploy-network`. |

## 1. Llevar el script al VPS

Lo más simple es clonar (o actualizar) el repo en el VPS con git: así el script llega con
finales de línea LF.

```bash
git clone <url-del-repo> && cd Transporte/infra/osrm   # primera vez
git pull                                                # las siguientes
```

Si en cambio se copia el archivo desde Windows (scp, WinSCP, etc.), hay que convertir los
finales de línea antes de ejecutarlo:

```bash
sed -i 's/\r$//' preparar-datos.sh    # o: dos2unix preparar-datos.sh
```

Un `.sh` con CRLF falla con `bash\r: No such file or directory`.

## 2. Preparar los datos (una sola vez)

Por SSH en el VPS, con Docker instalado:

```bash
chmod +x preparar-datos.sh
./preparar-datos.sh /opt/osrm-datos
```

- Necesita ~2 GB de RAM libres durante el preprocesado y ~3 GB libres de disco (el extracto
  de Argentina pesa ~430 MB y se borra al terminar; el recorte y el grafo quedan en unas
  decenas o pocos cientos de MB).
- Tarda unos minutos. Al final imprime el tamaño de los archivos `.osrm*` generados.
- El script comprueba que haya Docker y espacio antes de descargar. Es idempotente: se
  puede volver a correr y sobrescribe los datos anteriores.
- Si se cambia la carpeta de datos, hay que cambiar también el volumen
  `/opt/osrm-datos:/data:ro` del compose.

## 3. Levantar el servicio en Dokploy

Crear en Dokploy una aplicación de tipo **Compose** apuntando a `infra/osrm/docker-compose.yml`
de este repo (en una rama que ya contenga la carpeta `infra/osrm/`) y desplegarla.

- El servicio se une a la red externa `dokploy-network` con el alias `osrm-tucuman`, así que
  `api-dev` y `api-prod` lo alcanzan en `http://osrm-tucuman:5000`.
- No publica puertos: no es accesible desde internet, y está bien que así sea.
- Tope de memoria de 1500 MB: si algo se desmadra, muere el contenedor y no el VPS.

## 4. Apuntar el backend al motor propio

Cargar en el dashboard de Dokploy, en la app `api-prod`:

| Variable | Valor |
|---|---|
| `Ruteo__BaseUrl` | `http://osrm-tucuman:5000` |
| `Ruteo__PausaEntreConsultasMs` | `0` |

La pausa entre consultas existía para respetar el límite de 1 pedido por segundo del demo
público; con motor propio no hace falta. **Hay que hacer redeploy de `api-prod`** para que
tome las variables. `api-dev` puede seguir con el demo público o usar este mismo motor con
las mismas variables.

## 5. Verificar

Desde el VPS, con un contenedor efímero en la misma red (la imagen de la API no trae
`curl` ni `wget`, así que no sirve `docker exec` ahí):

```bash
docker run --rm --network dokploy-network curlimages/curl:latest -s \
  "http://osrm-tucuman:5000/route/v1/driving/-65.2860859,-26.8225289;-65.2742406,-26.8158608?overview=false"
```

Tiene que devolver `"code":"Ok"` y una `distance` de alrededor de 3060 metros: es el tramo
entre el colegio Boisdron y el San Patricio.

Para probar `/trip` (lo usa el cálculo marginal), con cuatro puntos de Yerba Buena
(coordenadas aproximadas, orden `lon,lat`):

```bash
docker run --rm --network dokploy-network curlimages/curl:latest -s \
  "http://osrm-tucuman:5000/trip/v1/driving/-65.2860859,-26.8225289;-65.2742406,-26.8158608;-65.3000,-26.8200;-65.2900,-26.8100?source=any&destination=last&roundtrip=false&overview=false"
```

Tiene que devolver `"code":"Ok"` con un `trips[0].distance` razonable y `waypoints` con el
orden óptimo de visita.

## Actualizar el mapa

OpenStreetMap se edita todos los días y Yerba Buena tiene ediciones recientes. Una vez por
año alcanza: actualizar el repo en el VPS, volver a correr `./preparar-datos.sh /opt/osrm-datos`
y reiniciar el servicio `osrm-tucuman` en Dokploy para que cargue el grafo nuevo.

## Si algo falla

- **El backend no resuelve `osrm-tucuman`** (`Name or service not known`): el servicio no
  está en `dokploy-network` o el alias no se aplicó. Revisar que el compose esté desplegado y
  corriendo, y que la red externa `dokploy-network` exista en el VPS.
- **El contenedor muere y se reinicia** (OOM, exit code 137): el grafo no entra en el tope
  de memoria. Subir `limits.memory` en `docker-compose.yml` (por ejemplo a `2G`) y redeployar.
- **`NoRoute` para puntos concretos**: la coordenada cae fuera del recorte o en una zona sin
  calles en OpenStreetMap. Revisar el `BBOX` del script (`-66.2,-28.1,-64.4,-25.9`) y que el
  pin no esté en un lugar sin acceso vial.
