# 🧪 Guía Rápida de Pruebas IAP

## 🚀 Prueba Rápida en 3 Pasos

### 1️⃣ Configurar Token de Desarrollo

Crea `.env.local` en la raíz:

```bash
DEV_ADMIN_TOKEN=mi-token-123
```

### 2️⃣ Iniciar el Servidor

```bash
pnpm dev
```

### 3️⃣ Acceder al Admin

Abre tu navegador y ve a:

```
http://localhost:3000/admin?token=mi-token-123
```

**¡Listo!** ✅ Deberías ver:
- Panel de administración cargado
- Badge verde "✓ Autenticado con IAP"
- Badge amarillo "🔧 Modo Desarrollo"
- Info del usuario: `admin@desarrollo.local`

---

## 🔍 Lo Que Acabas de Probar

### Middleware (`middleware.ts`)
- ✅ Intercepta rutas `/admin`
- ✅ Verifica token en query param `?token=`
- ✅ Crea cookie de sesión (dura 7 días)
- ✅ En producción verificará JWT de IAP

### API de Usuario (`/api/user-info`)
- ✅ Extrae información del usuario
- ✅ En desarrollo retorna usuario mock
- ✅ En producción lee header IAP

### Header del Admin
- ✅ Muestra email del usuario
- ✅ Badge de autenticación IAP
- ✅ Avatar con inicial
- ✅ Indicador de modo

---

## 🎯 Próximas Visitas

Una vez autenticado, puedes acceder directamente:

```
http://localhost:3000/admin
```

**Sin necesidad del token** - la sesión se mantiene por 7 días ✅

---

## 🧹 Limpiar Sesión

Para probar de nuevo desde cero:

### Opción 1: Borrar Cookie
Abre DevTools (F12) → Application → Cookies → Borrar `iap_session`

### Opción 2: Navegación Privada
Abre una ventana incógnito

---

## 📊 Verificar Configuración

### Endpoint de Prueba

```bash
curl http://localhost:3000/api/verify-iap
```

**Respuesta esperada:**
```json
{
  "message": "Endpoint de verificación IAP",
  "status": "ready",
  "config": {
    "iapAudienceConfigured": false,
    "nodeEnv": "development"
  }
}
```

### Info de Usuario

```bash
# Sin autenticar (retorna 401)
curl http://localhost:3000/api/user-info

# Con cookie de sesión (después de autenticar)
curl http://localhost:3000/api/user-info \
  -H "Cookie: iap_session=dev_mode"
```

---

## 🎨 Lo Que Verás en el Admin

### Header
```
┌─────────────────────────────────────────────────┐
│ [Logo Bancamía] | Panel de Administración       │
│                   ✓ Autenticado con IAP         │
│                   🔧 Modo Desarrollo             │
│                                                  │
│                        [A] admin@desarrollo.local│
│                        desarrollo.local          │
│                   [Volver al Formulario]        │
└─────────────────────────────────────────────────┘
```

### Estadísticas
- Total Solicitudes
- Monto Total Solicitado  
- Solicitudes Hoy
- Promedio por Solicitud

### Tabla de Solicitudes
- Búsqueda por nombre, documento, email, ID
- Ver detalles completos
- Exportar a CSV
- Eliminar solicitudes

---

## 🚀 Desplegar con IAP Real

Cuando estés listo para GCP:

```bash
# 1. Desplegar
gcloud run deploy bancamia-form \
  --source=. \
  --region=us-central1

# 2. Configurar IAP_AUDIENCE
gcloud run services update bancamia-form \
  --set-env-vars="IAP_AUDIENCE=/projects/123456/apps/bancamia-form"

# 3. Habilitar IAP en Console
# GCP Console > Security > Identity-Aware Proxy
```

Ver [IAP_SETUP.md](./IAP_SETUP.md) para guía completa.

---

## ❓ FAQ

**P: ¿El token expira?**  
R: En desarrollo, la sesión dura 7 días. En producción con IAP, Google maneja la expiración (típicamente 14 días).

**P: ¿Puedo cambiar el token?**  
R: Sí, cambia `DEV_ADMIN_TOKEN` en `.env.local` y reinicia el servidor.

**P: ¿Funciona en producción sin IAP?**  
R: Sí, puedes usar el mismo sistema de tokens. Pero IAP es más seguro.

**P: ¿Cómo agrego más usuarios?**  
R: En desarrollo todos usan el mismo token. En producción, agregas usuarios en GCP IAP.

**P: ¿El cliente puede pasar su propio token?**  
R: Sí, el cliente puede generar JWT con información del usuario. Ver [IAP_SETUP.md](./IAP_SETUP.md#opción-3-jwt-token-del-cliente).

---

## 🆘 Problemas Comunes

### "No autorizado"
```bash
# Verifica que el token sea correcto
echo $DEV_ADMIN_TOKEN  # debe mostrar tu token

# Verifica la URL
# ✅ Correcto: http://localhost:3000/admin?token=mi-token-123
# ❌ Incorrecto: http://localhost:3000/admin
```

### "Cookie no se guarda"
- Reinicia el navegador
- Usa navegación privada
- Verifica que estés en `localhost` (no `127.0.0.1`)

### "No veo info del usuario"
- Abre DevTools y ve a la pestaña Network
- Busca la llamada a `/api/user-info`
- Revisa la respuesta

---

## ✅ Checklist de Prueba

- [ ] Crear `.env.local` con `DEV_ADMIN_TOKEN`
- [ ] Iniciar servidor: `pnpm dev`
- [ ] Acceder: `http://localhost:3000/admin?token=TU_TOKEN`
- [ ] Ver badge verde "Autenticado con IAP"
- [ ] Ver info del usuario en header
- [ ] Cerrar y reabrir: `http://localhost:3000/admin` (sin token)
- [ ] Verificar que funciona (sesión guardada)
- [ ] Probar endpoint: `curl http://localhost:3000/api/verify-iap`

---

**Todo funcionando?** 🎉 Estás listo para integrar con GCP IAP!

