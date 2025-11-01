// Tipos de datos para el formulario de crédito

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
  tipoContrato: string;
  ingresosMensuales: string;
  tiempoEmpleo: string;
  cargoActual: string;
  
  // Información del Crédito
  montoSolicitado: string;
  plazoMeses: string;
  proposito: string;
  tieneDeudas: string;
  montoDeudas?: string;
  
  // Referencias
  refNombre1: string;
  refTelefono1: string;
  refRelacion1: string;
  refNombre2: string;
  refTelefono2: string;
  refRelacion2: string;
}

export const initialFormData: SolicitudCredito = {
  // Información Personal
  nombreCompleto: "",
  tipoDocumento: "CC",
  numeroDocumento: "",
  fechaNacimiento: "",
  estadoCivil: "",
  genero: "",
  telefono: "",
  email: "",
  direccion: "",
  ciudad: "",
  departamento: "",
  
  // Información Laboral
  ocupacion: "",
  empresa: "",
  tipoContrato: "",
  ingresosMensuales: "",
  tiempoEmpleo: "",
  cargoActual: "",
  
  // Información del Crédito
  montoSolicitado: "",
  plazoMeses: "",
  proposito: "",
  tieneDeudas: "no",
  montoDeudas: "",
  
  // Referencias
  refNombre1: "",
  refTelefono1: "",
  refRelacion1: "",
  refNombre2: "",
  refTelefono2: "",
  refRelacion2: "",
};


