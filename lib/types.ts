// Tipos de datos para el formulario de autorización de datos Bancamía
// Basado en el formulario oficial de Google Forms

export interface Documento {
  fileName: string;
  originalName: string;
  path: string;
  url: string;
}

export interface AutorizacionDatos {
  id?: string;
  fechaSolicitud?: string;
  
  // Email
  email: string;
  
  // Autorizaciones (requeridas)
  autorizacionTratamientoDatos: boolean;
  autorizacionContacto: boolean;
  
  // Información Personal
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  fechaExpedicionDocumento: string;
  
  // Información de Negocio
  ciudadNegocio: string;
  direccionNegocio: string;
  celularNegocio: string;
  
  // Documento PDF
  documento?: Documento;
  
  // Campos adicionales de la base de datos
  estado?: string;
  userId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export const initialFormData: AutorizacionDatos = {
  // Email
  email: "",
  
  // Autorizaciones
  autorizacionTratamientoDatos: false,
  autorizacionContacto: false,
  
  // Información Personal
  nombreCompleto: "",
  tipoDocumento: "CC",
  numeroDocumento: "",
  fechaNacimiento: "",
  fechaExpedicionDocumento: "",
  
  // Información de Negocio
  ciudadNegocio: "",
  direccionNegocio: "",
  celularNegocio: "",
};

// Tipo de datos para solicitud de crédito
export interface SolicitudCredito {
  id?: string;
  fechaSolicitud?: string;
  
  // Información Personal
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  estadoCivil: string;
  genero: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  
  // Información Laboral
  ocupacion: string;
  empresa: string;
  cargoActual: string;
  tipoContrato: string;
  ingresosMensuales: string | number;
  tiempoEmpleo: string;
  
  // Información del Crédito
  montoSolicitado: string | number;
  plazoMeses: string;
  proposito: string;
  tieneDeudas: string;
  montoDeudas?: string | number;
  
  // Referencias Personales
  refNombre1: string;
  refTelefono1: string;
  refRelacion1: string;
  refNombre2: string;
  refTelefono2: string;
  refRelacion2: string;
}


