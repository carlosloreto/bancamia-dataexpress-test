# Endpoints que llama la API

Este documento lista todos los endpoints que tu aplicación llama, tanto internos (Next.js API routes) como externos (API backend de Bancamia).

## Endpoints Internos (Next.js API Routes)

Estos son endpoints que se ejecutan en el mismo servidor Next.js:

### 1. `/api/solicitudes`
- **Método**: `GET`
- **Descripción**: Proxy para obtener lista de solicitudes
- **Ubicación**: `app/api/solicitudes/route.ts`
- **Llamado desde**: 
  - `app/admin/page.tsx` (línea 50)
- **Llama a**: `${NEXT_PUBLIC_API_URL}/api/v3/solicitudes` (GET)

- **Método**: `POST`
- **Descripción**: Proxy para crear nueva solicitud
- **Ubicación**: `app/api/solicitudes/route.ts`
- **Llamado desde**: 
  - `lib/api.ts` → `enviarSolicitudCredito()` (línea 290)
  - `app/formulario/page.tsx` (línea 343)
- **Llama a**: `${NEXT_PUBLIC_API_URL}/api/v3/solicitudes` (POST)

### 2. `/api/user-info`
- **Método**: `GET`
- **Descripción**: Obtiene información del usuario autenticado (IAP)
- **Ubicación**: `app/api/user-info/route.ts`
- **Llama internamente a**: `/api/verify-iap` (POST)

### 3. `/api/test-api`
- **Método**: `GET`
- **Descripción**: Endpoint de prueba para verificar conexión con la API
- **Ubicación**: `app/api/test-api/route.ts`
- **Llama a**: `${NEXT_PUBLIC_API_URL}/health` (GET)

### 4. `/api/verify-iap`
- **Método**: `POST`
- **Descripción**: Verifica token IAP de Google Cloud Platform
- **Ubicación**: `app/api/verify-iap/route.ts`
- **Llamado desde**: `app/api/user-info/route.ts` (línea 12)

- **Método**: `GET`
- **Descripción**: Endpoint de estado para verificar configuración IAP
- **Ubicación**: `app/api/verify-iap/route.ts`

---

## Endpoints Externos (API Backend de Bancamia)

Estos son endpoints que se llaman a la API externa configurada en `NEXT_PUBLIC_API_URL`:

### 1. `/api/v3/solicitudes`
- **Método**: `GET`
- **Descripción**: Obtener lista de solicitudes de crédito
- **Llamado desde**: `app/api/solicitudes/route.ts` (línea 38, 70)
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer {token}` (opcional)

- **Método**: `POST`
- **Descripción**: Crear nueva solicitud de crédito
- **Llamado desde**: `app/api/solicitudes/route.ts` (línea 225, 266)
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer {token}` (opcional)
- **Body**: Datos de la solicitud de crédito (JSON)

### 2. `/api/v3/auth/login`
- **Método**: `POST`
- **Descripción**: Autenticar usuario con Firebase idToken
- **Llamado desde**: `lib/auth.service.ts` → `login()` (línea 97)
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer {firebaseIdToken}` (automático via api-client)
- **Body**: 
  ```json
  {
    "idToken": "string"
  }
  ```

### 3. `/api/v3/auth/register`
- **Método**: `POST`
- **Descripción**: Registrar nuevo usuario
- **Llamado desde**: `lib/auth.service.ts` → `register()` (línea 169)
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer {firebaseIdToken}` (automático via api-client)
- **Body**: 
  ```json
  {
    "email": "string",
    "password": "string",
    "displayName": "string"
  }
  ```

### 4. `/api/v3/auth/verify`
- **Método**: `POST`
- **Descripción**: Verificar idToken de Firebase
- **Llamado desde**: `lib/auth.service.ts` → `verify()` (línea 222)
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer {firebaseIdToken}` (automático via api-client)
- **Body**: 
  ```json
  {
    "idToken": "string"
  }
  ```

### 5. `/api/v3/auth/me`
- **Método**: `GET`
- **Descripción**: Obtener perfil del usuario autenticado
- **Llamado desde**: `lib/auth.service.ts` → `getProfile()` (línea 273)
- **Headers**: 
  - `Authorization: Bearer {firebaseIdToken}` (automático via api-client)

### 6. `/health`
- **Método**: `GET`
- **Descripción**: Health check de la API
- **Llamado desde**: `app/api/test-api/route.ts` (línea 29, 31)
- **Headers**: `Content-Type: application/json`

---

## Cliente API

El proyecto usa un cliente API centralizado en `lib/api-client.ts` que:

- **Base URL**: Configurada en `NEXT_PUBLIC_API_URL` (variable de entorno)
- **Timeout**: 30 segundos por defecto
- **Interceptores**:
  - **Request**: Agrega automáticamente el token de Firebase (`Authorization: Bearer {idToken}`)
  - **Response**: Maneja errores globalmente (401, 403, 500, etc.) y renueva tokens automáticamente

### Métodos disponibles:
- `api.get<T>(url)` - GET request
- `api.post<T>(url, data)` - POST request
- `api.put<T>(url, data)` - PUT request
- `api.delete<T>(url)` - DELETE request

---

## Variables de Entorno Requeridas

- `NEXT_PUBLIC_API_URL`: URL base de la API backend de Bancamia
- `IAP_AUDIENCE`: Audience para verificación de tokens IAP (opcional, solo para producción)
- `NEXT_PUBLIC_APP_URL`: URL de la aplicación (usado en `/api/user-info`)

---

## Flujo de Autenticación

1. Usuario se autentica con Firebase Auth (obtiene `idToken`)
2. Frontend envía `idToken` a `/api/v3/auth/login` o `/api/v3/auth/register`
3. Backend valida el token y retorna información del usuario
4. Para peticiones subsecuentes, el `api-client` agrega automáticamente el `idToken` en el header `Authorization`
5. Si el token expira (401), el interceptor intenta renovarlo automáticamente

---

## Notas

- Los endpoints internos (`/api/*`) actúan como proxies para evitar problemas de CORS
- Los timeouts están configurados:
  - GET `/api/solicitudes`: 60 segundos
  - POST `/api/solicitudes`: 180 segundos (3 minutos)
  - Cliente API: 30 segundos
- El cliente API maneja automáticamente la renovación de tokens de Firebase

