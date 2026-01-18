# TransporteFront - Portal de Gestión de Transporte Escolar

Frontend React + TypeScript para el sistema de gestión de transporte escolar.

## 🚀 Stack Tecnológico

- **React 19** + **TypeScript**
- **Vite** - Build tool
- **TailwindCSS** - Estilos
- **TanStack Query v5** - Manejo de estado de servidor
- **React Router v6** - Navegación
- **React Hook Form + Zod** - Formularios y validación (preparado)
- **Axios** - Cliente HTTP

## 📁 Arquitectura

El proyecto sigue **Screaming Architecture** (arquitectura que refleja el dominio):

```
src/
  ├── app/                    # Bootstrap, providers, routing
  │   ├── MainLayout.tsx
  │   └── DashboardPage.tsx
  ├── shared/                 # Código compartido
  │   ├── ui/                 # Componentes UI reutilizables
  │   ├── utils/              # Utilidades
  │   ├── types/              # Tipos globales
  │   └── hooks/              # Hooks personalizados
  ├── api/                    # Cliente HTTP centralizado
  │   └── client.ts           # Axios instance + interceptors
  ├── config/                 # Configuración (env)
  ├── titulares/              # Dominio: Titulares
  │   ├── pages/              # Páginas/pantallas
  │   ├── components/         # Componentes específicos
  │   ├── api/                # Queries y mutaciones (TanStack Query)
  │   └── types/              # Tipos del dominio
  └── pasajeros/              # Dominio: Pasajeros
      └── (misma estructura)
```

## ⚙️ Configuración

### 1. Variables de entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
VITE_API_BASE_URL=http://localhost:5074/api
```

Ver `.env.example` para referencia.

### 2. Instalar dependencias

```bash
npm install
```

### 3. Correr en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### 4. Build para producción

```bash
npm run build
npm run preview  # Preview del build
```

## 📡 Backend

El frontend consume la API .NET ubicada en `http://localhost:5074/api` (configurable via `.env`).

### Endpoints consumidos:

**Titulares** (`/titulares`):
- `GET /` - Todos los titulares
- `GET /activos` - Solo activos
- `GET /selector` - Para dropdowns
- `GET /{id}` - Detalle por ID
- `POST /` - Crear
- `PUT /{id}` - Actualizar
- `DELETE /{id}` - Baja lógica

**Pasajeros** (`/pasajeros`):
- `GET /` - Todos los pasajeros
- `GET /activos` - Solo activos
- `GET /titular/{titularId}` - Por titular
- `GET /{id}` - Detalle por ID
- `POST /` - Crear
- `PUT /{id}` - Actualizar
- `DELETE /{id}` - Baja lógica

## 🎯 Funcionalidades Implementadas

### ✅ Pantallas Operativas

1. **Dashboard** (`/`)
   - Vista general del sistema
   - Accesos rápidos a Titulares y Pasajeros

2. **Titulares** (`/titulares`)
   - Listado de titulares activos
   - Tarjetas con información completa (contacto, dirección, monto)
   - Navegación a detalle y pasajeros asociados

3. **Detalle de Titular** (`/titulares/:id`)
   - Información completa del titular
   - Listado de pasajeros asociados
   - Acceso rápido para agregar pasajeros

4. **Pasajeros** (`/pasajeros`)
   - Listado de pasajeros activos
   - Información de colegio, grado, turno
   - Navegación a titular asociado

### 🔧 Features Técnicas

- ✅ Cliente HTTP centralizado con interceptors (preparado para auth)
- ✅ Manejo de estados: loading, error, empty
- ✅ Cache inteligente con TanStack Query
- ✅ Invalidación automática de cache post-mutaciones
- ✅ Componentes UI reutilizables (Button, Card, Alert, Spinner)
- ✅ Tipos TypeScript mapeados desde DTOs del backend
- ✅ Layout responsivo con sidebar de navegación

## 🔐 Autenticación

**Estado actual**: Sin autenticación implementada.

**Preparación para futuro**: 
- El cliente Axios tiene interceptors listos para agregar `Authorization` header
- Solo descomentar líneas en `src/api/client.ts` cuando se implemente auth

## 🎨 Estilos

TailwindCSS configurado con:
- Modo dark preparado (no activado)
- Paleta de colores base de Tailwind
- Configuración extensible en `tailwind.config.js`

## 🧪 Scripts Disponibles

```bash
npm run dev       # Servidor desarrollo (port 5173)
npm run build     # Build producción
npm run lint      # Linter (ESLint)
npm run preview   # Preview del build
```

## 📝 Notas de Desarrollo

- **No hay autenticación**: Todos los endpoints son accesibles sin login
- **Formularios**: Pantallas de creación/edición pendientes (estructura lista)
- **Validaciones**: React Hook Form + Zod configurados pero no implementados en pantallas
- **Testing**: Sin tests por ahora

## 🚧 Próximos Pasos (Futuro)

1. Implementar formularios de creación/edición (Titulares y Pasajeros)
2. Agregar autenticación (OIDC/OAuth2)
3. Módulo de Pagos Mensuales
4. Módulo de Reinscripciones
5. Dashboard con métricas/estadísticas
6. Notificaciones toast
7. Testing (Vitest + React Testing Library)

## 📄 Licencia

Proyecto privado - Uso interno
