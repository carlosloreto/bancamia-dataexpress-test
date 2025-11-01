# 🔐 Configuración de Identity-Aware Proxy (IAP)

Esta guía te ayudará a configurar IAP de GCP para proteger el área de administración.

## 📋 Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```bash
# ====================================
# CONFIGURACIÓN IAP
# ====================================

# Audience ID de IAP de GCP
# Formato: /projects/PROJECT_NUMBER/apps/PROJECT_ID
IAP_AUDIENCE=/projects/123456789/apps/bancamia-form

# URL de tu aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ====================================
# DESARROLLO LOCAL (Sin IAP)
# ====================================

# Token simple para acceder al admin en desarrollo
DEV_ADMIN_TOKEN=dev-token-123
```

## 🚀 Modo Desarrollo (Local)

Para probar localmente **SIN IAP**:

1. Crea `.env.local` con:
```bash
DEV_ADMIN_TOKEN=mi-token-secreto
```

2. Accede al admin con:
```
http://localhost:3000/admin?token=mi-token-secreto
```

3. El sistema creará una sesión que durará 7 días ✅

## ☁️ Configuración IAP en GCP

### Paso 1: Desplegar en Cloud Run

```bash
# Desde la raíz del proyecto
gcloud run deploy bancamia-form \
  --source=. \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated
```

### Paso 2: Habilitar IAP

1. Ve a [GCP Console > Security > Identity-Aware Proxy](https://console.cloud.google.com/security/iap)

2. Encuentra tu aplicación `bancamia-form`

3. Click en el toggle para **HABILITAR IAP**

4. Copia el **Audience** que aparece (formato: `/projects/123456/apps/bancamia-form`)

### Paso 3: Configurar Variables de Entorno en Cloud Run

```bash
# Actualizar con el IAP Audience
gcloud run services update bancamia-form \
  --region=us-central1 \
  --set-env-vars="IAP_AUDIENCE=/projects/TU_PROJECT_NUMBER/apps/bancamia-form"
```

### Paso 4: Agregar Usuarios Autorizados

En GCP Console > IAP:

1. Selecciona tu aplicación
2. Click en **"Add Member"**
3. Agrega emails de usuarios autorizados
4. Asigna rol: **"IAP-secured Web App User"**

## 🧪 Probar IAP

### Verificar configuración:

```bash
# Endpoint de prueba
curl https://tu-app.run.app/api/verify-iap

# Respuesta esperada:
{
  "message": "Endpoint de verificación IAP",
  "status": "ready",
  "config": {
    "iapAudienceConfigured": true,
    "nodeEnv": "production"
  }
}
```

### Acceder al admin:

1. Usuario autorizado navega a: `https://tu-app.run.app/admin`
2. Si no está logueado, IAP pedirá login de Google
3. Una vez autenticado, entra automáticamente ✅
4. El header mostrará el email del usuario

## 🔄 Integración con Sistema del Cliente

### Opción 1: Token en URL (Desarrollo/Demo)

El cliente genera un link:
```javascript
const token = "token-secreto-compartido";
window.open(`https://bancamia.run.app/admin?token=${token}`);
```

### Opción 2: IAP Compartido (Producción)

Si el cliente usa Google Workspace:

1. Tu app debe estar en el mismo proyecto GCP o linked project
2. IAP del cliente automáticamente autentica en tu app
3. Sin código adicional - todo transparente ✅

### Opción 3: JWT Token del Cliente

El cliente genera JWT con info del usuario:

```javascript
// Sistema del cliente
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  {
    email: 'usuario@cliente.com',
    name: 'Juan Pérez'
  },
  'clave-secreta-compartida'
);

window.open(`https://bancamia.run.app/admin?token=${token}`);
```

## 📊 Qué Muestra el Admin

Cuando un usuario accede con IAP:

- ✅ Email del usuario autenticado
- ✅ Dominio (para Google Workspace)
- ✅ Badge de "Autenticado con IAP"
- ✅ Avatar con inicial del nombre
- ✅ Indicador de modo (desarrollo/producción)

## 🛡️ Seguridad

### En Desarrollo:
- Token simple en URL
- Sin verificación real
- Solo para pruebas locales

### En Producción con IAP:
- Google maneja autenticación
- Tokens JWT verificados
- Lista blanca de usuarios en IAM
- Logs de auditoría en GCP
- SSL/TLS automático

## 🔧 Troubleshooting

### "Token inválido"
- Verifica que `IAP_AUDIENCE` sea correcto
- Formato debe ser: `/projects/NUMBER/apps/ID`

### "No autorizado"
- Usuario no está en la lista de IAP
- Agregar en GCP Console > IAP > Add Member

### "Header x-goog-iap-jwt-assertion no encontrado"
- IAP no está habilitado
- O estás accediendo directamente sin pasar por IAP

### Desarrollo local sin IAP
- Usa `?token=tu-dev-token`
- Asegúrate que `DEV_ADMIN_TOKEN` esté en `.env.local`

## 📚 Referencias

- [IAP Documentation](https://cloud.google.com/iap/docs)
- [Verifying IAP JWT](https://cloud.google.com/iap/docs/signed-headers-howto)
- [Cloud Run + IAP](https://cloud.google.com/run/docs/authenticating/end-users)

## 🆘 Soporte

Para preguntas o problemas:
1. Revisa los logs: `gcloud run logs read bancamia-form`
2. Verifica configuración IAP en GCP Console
3. Prueba endpoint: `/api/verify-iap`

