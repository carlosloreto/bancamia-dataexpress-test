# 🚀 Guía de Deploy desde Google Cloud Console

Esta guía te mostrará cómo desplegar tu aplicación Next.js en Cloud Run usando la interfaz web de Google Cloud Console.

## 📋 Requisitos Previos

1. Tener una cuenta de Google Cloud con facturación habilitada
2. Tener acceso a Google Cloud Console: https://console.cloud.google.com
3. Tu código debe estar en un repositorio (GitHub, GitLab, etc.) o subido como archivo ZIP

## 🎯 Paso 1: Preparar el Código para Subir

Si tu código está en un repositorio Git, puedes conectarlo directamente. Si no, necesitarás subirlo como archivo ZIP.

### Opción A: Desde Repositorio Git (Recomendado)

1. Sube tu código a GitHub/GitLab/Bitbucket
2. Asegúrate de incluir todos los archivos necesarios
3. **IMPORTANTE**: NO incluyas `.env.local` en el repositorio (está en `.gitignore`)

### Opción B: Como Archivo ZIP

1. En tu máquina local, crea un ZIP con todos los archivos del proyecto
2. **EXCLUYE**: `node_modules`, `.next`, `.env.local`, archivos de IDE
3. El ZIP debe incluir: código fuente, `package.json`, `next.config.ts`, etc.

## 🏗️ Paso 2: Crear Nuevo Servicio en Cloud Run

1. Ve a [Google Cloud Console](https://console.cloud.google.com)

2. Selecciona tu proyecto (o crea uno nuevo si no tienes)

3. Navega a **Cloud Run**:
   - En el menú izquierdo, busca "Cloud Run"
   - O ve directamente a: https://console.cloud.google.com/run

4. Haz clic en **"CREATE SERVICE"** (Crear Servicio)

## ⚙️ Paso 3: Configurar el Deploy

### Pestaña 1: **Container Settings**

1. **Service name**: `bancamia-form` (o el nombre que prefieras)

2. **Region**: Selecciona la región más cercana (ej: `us-central1`, `southamerica-east1`)

3. **Authentication**: 
   - Selecciona **"Allow unauthenticated invocations"** ✅
   - Esto permite que cualquiera acceda a tu aplicación pública

### Pestaña 2: **Container** (si usas ZIP)

1. Selecciona **"Deploy one revision from a source repository"** o **"Deploy one revision from an artifact registry image"**

2. Si subes desde Git:
   - Selecciona tu repositorio
   - Conecta tu cuenta de GitHub/GitLab si es necesario
   - Selecciona la rama (normalmente `main` o `master`)

3. Si usas ZIP o archivo local:
   - Selecciona **"Browse"** o **"Upload"**
   - Sube tu archivo ZIP o selecciona los archivos

### Pestaña 3: **Variables & Secrets** (Variables de Entorno)

Aquí configurarás las variables de entorno. Puedes hacerlo ahora o después del deploy:

1. Haz clic en **"ADD VARIABLE"** para cada variable:

   **Variable 1:**
   - Name: `NODE_ENV`
   - Value: `production`

   **Variable 2:**
   - Name: `NEXT_PUBLIC_APP_URL`
   - Value: `https://bancamia-form-XXXXX.run.app` 
   - ⚠️ **Nota**: Primero despliega, luego actualiza esta variable con la URL real que te dé Cloud Run

   **Variable 3 (Opcional - configurar después de habilitar IAP):**
   - Name: `IAP_AUDIENCE`
   - Value: `/projects/TU_PROJECT_NUMBER/apps/bancamia-form`
   - ⚠️ **Nota**: Obtén este valor después de habilitar IAP en el Paso 6

### Pestaña 4: **Connections**

No necesitas configurar nada aquí por ahora.

### Pestaña 5: **Security**

1. **CPU allocation**: "CPU is only allocated during request processing"
2. **Memory**: Selecciona al menos **512 MiB** (recomendado 1 GiB)
3. **CPU**: 1 CPU es suficiente para empezar
4. **Maximum instances**: 10 (o el límite que prefieras)
5. **Minimum instances**: 0 (para ahorrar costos cuando no hay tráfico)

### Pestaña 6: **Networking**

1. **Ingress**: "All traffic" ✅
2. **Port**: Déjalo en **8080** (Cloud Run usa este puerto, tu código lo maneja automáticamente con `server.js`)
3. **Startup command**: Déjalo vacío (se usará `npm start` del `package.json`)

## 🚀 Paso 4: Desplegar

1. Revisa todas las configuraciones

2. Haz clic en **"CREATE"** (Crear) o **"DEPLOY"** (Desplegar)

3. ⏳ Espera 5-10 minutos mientras:
   - Cloud Run construye tu aplicación
   - Instala dependencias (`npm install`)
   - Compila Next.js (`npm run build`)
   - Inicia el servidor

4. Una vez completado, verás una pantalla de éxito con la **URL de tu aplicación**

## 🔗 Paso 5: Obtener la URL y Actualizar Variables

1. Copia la URL que Cloud Run te proporcionó (ej: `https://bancamia-form-abc123.us-central1.run.app`)

2. Actualiza la variable `NEXT_PUBLIC_APP_URL`:
   - Ve a tu servicio en Cloud Run
   - Haz clic en **"EDIT & DEPLOY NEW REVISION"**
   - Ve a la pestaña **"Variables & Secrets"**
   - Actualiza `NEXT_PUBLIC_APP_URL` con la URL real
   - Haz clic en **"DEPLOY"**

## 🔐 Paso 6: Configurar IAP (Identity-Aware Proxy) - Opcional

Si quieres proteger el área `/admin` con autenticación de Google:

### 6.1 Habilitar IAP

1. Ve a [IAP Console](https://console.cloud.google.com/security/iap)

2. En la lista de recursos, busca tu servicio Cloud Run `bancamia-form`

3. Haz clic en el **toggle** para habilitar IAP

4. Copia el **Audience ID** que aparece (formato: `/projects/123456789/apps/bancamia-form`)

### 6.2 Configurar Variable IAP_AUDIENCE

1. Ve de vuelta a Cloud Run > Tu servicio

2. Haz clic en **"EDIT & DEPLOY NEW REVISION"**

3. Ve a **"Variables & Secrets"**

4. Agrega o actualiza:
   - Name: `IAP_AUDIENCE`
   - Value: (pega el Audience ID que copiaste)

5. Haz clic en **"DEPLOY"**

### 6.3 Agregar Usuarios Autorizados

1. En [IAP Console](https://console.cloud.google.com/security/iap)

2. Selecciona tu servicio `bancamia-form`

3. Haz clic en **"ADD MEMBER"**

4. Agrega los emails de usuarios autorizados

5. Asigna el rol: **"IAP-secured Web App User"**

6. Haz clic en **"SAVE"**

## ✅ Paso 7: Verificar que Todo Funciona

1. **Prueba la aplicación pública:**
   - Visita: `https://tu-url.run.app`
   - Deberías ver el formulario de solicitud de crédito

2. **Prueba el admin (si configuraste IAP):**
   - Visita: `https://tu-url.run.app/admin`
   - Deberías ser redirigido a login de Google (si IAP está activo)
   - O usar el token de desarrollo si está configurado

3. **Verifica logs (si hay problemas):**
   - En Cloud Run > Tu servicio > Pestaña "LOGS"
   - Revisa los logs para ver si hay errores

## 🔧 Configuraciones Adicionales Importantes

### Memoria Recomendada

Para Next.js con React 19:
- **Mínimo**: 512 MiB
- **Recomendado**: 1 GiB
- **Si tienes muchos usuarios**: 2 GiB

### Timeout

- Cloud Run tiene un timeout máximo de 60 minutos
- Para Next.js, 300 segundos (5 minutos) es suficiente

### Build Configuration

Cloud Run detecta automáticamente:
- ✅ Node.js desde `package.json`
- ✅ Comando `npm install` y `npm run build`
- ✅ Comando `npm start` para iniciar

No necesitas crear un Dockerfile manualmente.

## 📝 Resumen de Variables de Entorno

Después del deploy inicial, asegúrate de tener estas variables configuradas:

| Variable | Valor | Cuándo Configurarla |
|----------|-------|-------------------|
| `NODE_ENV` | `production` | Al hacer el deploy |
| `NEXT_PUBLIC_APP_URL` | `https://tu-url.run.app` | Después del primer deploy |
| `IAP_AUDIENCE` | `/projects/XXX/apps/bancamia-form` | Después de habilitar IAP |
| `DEV_ADMIN_TOKEN` | (opcional) | Solo si no usas IAP |

## 🆘 Troubleshooting

### Error: "Build failed"
- Revisa los logs en Cloud Run
- Verifica que `package.json` tenga el script `start`
- Asegúrate de que `server.js` esté incluido en el deploy

### Error: "Port not found"
- Verifica que `server.js` esté en la raíz del proyecto
- Verifica que `package.json` tenga `"start": "node server.js"`

### La aplicación no responde
- Verifica los logs en Cloud Run
- Asegúrate de que la memoria sea suficiente (1 GiB recomendado)
- Verifica que la variable `PORT` no esté configurada manualmente (Cloud Run la proporciona automáticamente)

### Error 404 en rutas
- Verifica que el build se haya completado correctamente
- Revisa los logs para ver errores de compilación

## 📚 Referencias

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Next.js on Cloud Run](https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nextjs-service)
- [IAP Setup Guide](./IAP_SETUP.md)

---

**¡Tu aplicación está lista para producción! 🎉**

