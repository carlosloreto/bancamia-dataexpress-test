# Configuración de CI/CD para Cloud Run con Dockerfile

Este proyecto usa Cloud Build con Dockerfile para despliegue automático a Cloud Run.

## Archivos de Configuración

- `Dockerfile` - Imagen Docker multi-stage optimizada para Next.js
- `cloudbuild.yaml` - Pipeline de CI/CD con build args
- `.dockerignore` - Archivos excluidos del build de Docker

## Configuración del Trigger en Cloud Build

### Desde la Consola de GCP (Recomendado)

1. **Conectar GitHub** (solo la primera vez):
   - Ve a https://console.cloud.google.com/cloud-build/triggers
   - Haz clic en **"Connect Repository"**
   - Selecciona **GitHub** y autoriza
   - Selecciona: `carlosloreto/bancamia-dataexpress-frontend`

2. **Crear el Trigger**:
   - Haz clic en **"Create Trigger"**
   - **Name**: `deploy-bancamia-frontend`
   - **Event**: Push to a branch
   - **Source**: Tu repositorio conectado
   - **Branch**: `^main$`
   - **Configuration**: Cloud Build configuration file
   - **Location**: `cloudbuild.yaml`

3. **Agregar Substitution Variables** (⚠️ IMPORTANTE):
   
   Haz clic en **"Add variable"** para cada una:
   
   | Variable | Valor |
   |----------|-------|
   | `_FIREBASE_API_KEY` | `AIzaSyBUuImiMy_1QvZcE4Pg7t6cxjYbG1HT_5A` |
   | `_FIREBASE_AUTH_DOMAIN` | `bancamia-dataexpress.firebaseapp.com` |
   | `_FIREBASE_PROJECT_ID` | `bancamia-dataexpress` |
   | `_FIREBASE_STORAGE_BUCKET` | `bancamia-dataexpress.firebasestorage.app` |
   | `_FIREBASE_MESSAGING_SENDER_ID` | `773449658013` |
   | `_FIREBASE_APP_ID` | `1:773449658013:web:1e0dafc4058fba91a7ae74` |
   | `_FIREBASE_MEASUREMENT_ID` | `G-PK1V1T3TD2` |
   | `_API_URL` | `https://bancamia-dataexpress-api-773449658013.southamerica-east1.run.app` |

4. **Guardar** el trigger

## Uso

Una vez configurado el trigger:

1. Haz cambios en tu código
2. Commitea y pushea a `main`:
   ```bash
   git add .
   git commit -m "tu mensaje"
   git push origin main
   ```
3. Cloud Build se activará automáticamente
4. El build de Docker usará las variables configuradas como build args
5. La imagen se desplegará a Cloud Run

## Despliegue Manual (Para Testing)

```bash
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_FIREBASE_API_KEY=AIzaSyBUuImiMy_1QvZcE4Pg7t6cxjYbG1HT_5A,_FIREBASE_AUTH_DOMAIN=bancamia-dataexpress.firebaseapp.com,_FIREBASE_PROJECT_ID=bancamia-dataexpress,_FIREBASE_STORAGE_BUCKET=bancamia-dataexpress.firebasestorage.app,_FIREBASE_MESSAGING_SENDER_ID=773449658013,_FIREBASE_APP_ID=1:773449658013:web:1e0dafc4058fba91a7ae74,_FIREBASE_MEASUREMENT_ID=G-PK1V1T3TD2,_API_URL=https://bancamia-dataexpress-api-773449658013.southamerica-east1.run.app
```

## Ventajas del Dockerfile

✅ Control total sobre el build process
✅ Build args inyectados durante el build de Docker
✅ Imagen optimizada multi-stage
✅ Reproducible en cualquier entorno
