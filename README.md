# 🏦 Bancamía - Sistema de Solicitud de Créditos

Sistema web completo para solicitud y gestión de créditos bancarios, desarrollado con **Next.js 16**, **React 19**, **TypeScript** y **Tailwind CSS 4**, siguiendo la identidad visual corporativa de Bancamía.

## 🎨 Características Principales

### 📝 Formulario Público
- ✅ **Diseño Corporativo**: Implementa los colores oficiales de Bancamía (#FF9B2D, #1E3A5F)
- ✅ **100% Responsive**: Adaptado para móvil, tablet y desktop
- ✅ **TypeScript**: Tipado fuerte para mayor seguridad
- ✅ **Validación Completa**: Campos obligatorios con validación HTML5
- ✅ **UI Moderna**: Animaciones y transiciones suaves
- ✅ **4 Secciones Organizadas**:
  1. Información Personal
  2. Información Laboral
  3. Información del Crédito
  4. Referencias Personales

### 👨‍💼 Panel de Administración
- ✅ **Tabla de Consultas**: Visualización de todas las solicitudes
- ✅ **Búsqueda y Filtros**: Encuentra solicitudes por nombre, documento, email o ID
- ✅ **Estadísticas en Tiempo Real**: Total de solicitudes, montos, promedios
- ✅ **Vista Detallada**: Modal con toda la información de cada solicitud
- ✅ **Exportar a CSV**: Descarga todas las solicitudes en formato CSV
- ✅ **Gestión Completa**: Ver y eliminar solicitudes

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 20.9 o superior
- pnpm (recomendado), npm, o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/bancamia-form.git
cd bancamia-form

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

### Acceso al Sistema

- **Formulario Público**: [http://localhost:3000](http://localhost:3000)
- **Panel de Administración**: [http://localhost:3000/admin](http://localhost:3000/admin)

### Configurar Acceso al Admin

Para acceder al panel de administración, necesitas configurar autenticación:

1. **Copia el archivo de configuración:**
```bash
cp env.example .env.local
```

2. **Accede al admin con el token:**
```
http://localhost:3000/admin?token=dev-token-123
```

3. **¡Listo!** La sesión se guardará por 7 días.

📖 Ver [PRUEBAS_IAP.md](./PRUEBAS_IAP.md) para guía detallada  
☁️ Ver [IAP_SETUP.md](./IAP_SETUP.md) para configuración con GCP

## 📋 Estructura del Formulario

El formulario incluye las siguientes secciones:

### 1. **Información Personal**
- Nombre completo
- Tipo y número de documento
- Fecha de nacimiento
- Estado civil y género
- Datos de contacto (teléfono, email)
- Dirección completa

### 2. **Información Laboral**
- Ocupación y empresa
- Tipo de contrato
- Ingresos mensuales
- Tiempo en el empleo

### 3. **Información del Crédito**
- Monto solicitado
- Plazo en meses
- Propósito del crédito
- Información de deudas existentes

### 4. **Referencias Personales**
- Dos referencias con datos de contacto

## 📂 Estructura del Proyecto

```
bancamia-form/
├── app/
│   ├── page.tsx                 # Formulario público (página principal)
│   ├── admin/
│   │   └── page.tsx            # Panel de administración
│   ├── components/             # Componentes reutilizables (futuro)
│   ├── layout.tsx              # Layout principal
│   └── globals.css             # Estilos globales
├── lib/
│   ├── types.ts                # Tipos e interfaces TypeScript
│   └── storage.ts              # Servicio de almacenamiento (localStorage)
├── public/
│   ├── Bancamia2-300x99.png   # Logo Bancamía
│   └── FMF.png                # Logo Fundación BBVA
└── README.md
```

## 🔐 Seguridad y Autenticación

### Panel de Administración Protegido

El área `/admin` está protegida con soporte para:

- ✅ **IAP de Google Cloud** (Identity-Aware Proxy)
- ✅ **Tokens de desarrollo** para pruebas locales
- ✅ **Sesiones persistentes** (7 días)
- ✅ **Información del usuario** en el header

**Modos de autenticación:**

| Entorno | Método | Configuración |
|---------|--------|---------------|
| **Desarrollo** | Token simple | `DEV_ADMIN_TOKEN` en `.env.local` |
| **Producción** | IAP de GCP | `IAP_AUDIENCE` + configuración IAP |
| **Integración** | JWT del cliente | Token firmado compartido |

Ver documentación completa: [IAP_SETUP.md](./IAP_SETUP.md)

### Cómo Funciona

1. **Primera vez**: Usuario accede con token → Se crea sesión
2. **Siguientes veces**: Usuario entra directo → Sesión válida
3. **Con IAP**: Google maneja autenticación automáticamente
4. **Header**: Muestra email y dominio del usuario autenticado

## 💾 Almacenamiento de Datos

Actualmente el sistema utiliza **localStorage** del navegador para almacenar las solicitudes. Esto permite:
- ✅ Funcionamiento sin necesidad de backend
- ✅ Persistencia de datos entre sesiones
- ✅ Desarrollo y pruebas rápidas

### Migración Futura
El sistema está diseñado para migrar fácilmente a una base de datos real. Solo necesitas:
1. Reemplazar `lib/storage.ts` con llamadas a tu API/DB
2. Los tipos en `lib/types.ts` ya están listos para usar
3. El formato de datos es compatible con cualquier base de datos

## 🎨 Paleta de Colores

Los colores corporativos de Bancamía están definidos en `app/globals.css`:

- **Naranja Principal**: `#FF9B2D` - Color distintivo de Bancamía
- **Naranja Claro**: `#FFB85C` - Para gradientes y hover
- **Naranja Oscuro**: `#E6881A` - Estados hover
- **Azul Oscuro**: `#1E3A5F` - Títulos y textos importantes
- **Azul Medio**: `#2D5F8D` - Gradientes y elementos secundarios

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16.0.1 con App Router
- **React**: 19.2.0
- **TypeScript**: 5.9.3
- **Tailwind CSS**: 4.1.16
- **Bundler**: Turbopack (default)
- **Linter**: ESLint 9.39.0

## 📦 Scripts Disponibles

```bash
# Desarrollo con Turbopack
pnpm dev

# Build para producción
pnpm build

# Servidor de producción
pnpm start

# Linting
pnpm lint
```

## 🌐 Navegadores Soportados

- Chrome/Edge (últimas 2 versiones)
- Firefox (últimas 2 versiones)
- Safari (últimas 2 versiones)
- Opera (últimas 2 versiones)

## 📱 Responsive Design

El formulario está optimizado para:
- 📱 **Móviles**: 320px - 767px
- 📱 **Tablets**: 768px - 1023px
- 💻 **Desktop**: 1024px+

## 🔒 Seguridad y Privacidad

- Validación de formularios del lado del cliente
- Protección contra inyección de código
- Cumplimiento con políticas de privacidad

## 📄 Licencia

Este proyecto es propiedad de Bancamía © 2025

## 🤝 Contribución

Para contribuir al proyecto, por favor:
1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

¿Necesitas ayuda?
- **Lineamía Nacional**: 018000126100
- **Lineamía Bogotá**: 601 3077021
- **WhatsApp**: 310 860 02 01
- **Web**: [www.bancamia.com.co](https://www.bancamia.com.co)

---

**Bancamía** - El Banco de los que creen 💙
