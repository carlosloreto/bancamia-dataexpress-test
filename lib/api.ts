import { SolicitudCredito } from './types';

// Tipos para la respuesta de la API
export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    nombreCompleto: string;
    numeroDocumento: string;
    email: string;
    montoSolicitado: string;
    plazoMeses: string;
    estado: string;
    fechaSolicitud: string;
    createdAt: string;
    updatedAt: string;
    [key: string]: unknown;
  };
  error?: {
    name: string;
    message: string;
    statusCode: number;
    details?: {
      errors: Array<{
        type: string;
        message: string;
        field?: string;
        validValues?: string[];
      }>;
    };
  };
}

// Resultado de la función de envío
export interface EnvioResultado {
  success: boolean;
  id?: string;
  message: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

// Validar formato de email
function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validar que la fecha de nacimiento sea mayor de 18 años
function validarEdad(fechaNacimiento: string): boolean {
  try {
    const fecha = new Date(fechaNacimiento);
    // Verificar que la fecha sea válida
    if (isNaN(fecha.getTime())) {
      return false;
    }
    const hoy = new Date();
    const edad = hoy.getFullYear() - fecha.getFullYear();
    const mes = hoy.getMonth() - fecha.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
      return edad - 1 >= 18;
    }
    
    return edad >= 18;
  } catch {
    return false;
  }
}

// Validar valores permitidos para campos select
const VALORES_PERMITIDOS = {
  tipoDocumento: ['CC', 'CE', 'PA', 'TI'],
  estadoCivil: ['soltero', 'casado', 'union', 'divorciado', 'viudo'],
  genero: ['masculino', 'femenino', 'otro'],
  tipoContrato: ['indefinido', 'fijo', 'prestacion', 'independiente'],
  tiempoEmpleo: ['menos6', '6a12', '1a2', '2a5', 'mas5'],
  plazoMeses: ['12', '24', '36', '48', '60', '72'],
  tieneDeudas: ['si', 'no'],
};

// Validar datos antes de enviar
function validarDatos(solicitud: SolicitudCredito): { valido: boolean; errores: string[] } {
  const errores: string[] = [];

  // Validar email
  if (!validarEmail(solicitud.email)) {
    errores.push('El formato del email es inválido');
  }

  // Validar fecha de nacimiento
  if (solicitud.fechaNacimiento) {
    if (!validarEdad(solicitud.fechaNacimiento)) {
      errores.push('El solicitante debe ser mayor de 18 años');
    }
  }

  // Validar tipoDocumento
  if (!VALORES_PERMITIDOS.tipoDocumento.includes(solicitud.tipoDocumento)) {
    errores.push(`Tipo de documento inválido. Valores permitidos: ${VALORES_PERMITIDOS.tipoDocumento.join(', ')}`);
  }

  // Validar estadoCivil
  if (solicitud.estadoCivil && !VALORES_PERMITIDOS.estadoCivil.includes(solicitud.estadoCivil)) {
    errores.push(`Estado civil inválido. Valores permitidos: ${VALORES_PERMITIDOS.estadoCivil.join(', ')}`);
  }

  // Validar genero
  if (solicitud.genero && !VALORES_PERMITIDOS.genero.includes(solicitud.genero)) {
    errores.push(`Género inválido. Valores permitidos: ${VALORES_PERMITIDOS.genero.join(', ')}`);
  }

  // Validar tipoContrato
  if (solicitud.tipoContrato && !VALORES_PERMITIDOS.tipoContrato.includes(solicitud.tipoContrato)) {
    errores.push(`Tipo de contrato inválido. Valores permitidos: ${VALORES_PERMITIDOS.tipoContrato.join(', ')}`);
  }

  // Validar tiempoEmpleo
  if (solicitud.tiempoEmpleo && !VALORES_PERMITIDOS.tiempoEmpleo.includes(solicitud.tiempoEmpleo)) {
    errores.push(`Tiempo en el empleo inválido. Valores permitidos: ${VALORES_PERMITIDOS.tiempoEmpleo.join(', ')}`);
  }

  // Validar plazoMeses
  if (solicitud.plazoMeses && !VALORES_PERMITIDOS.plazoMeses.includes(solicitud.plazoMeses)) {
    errores.push(`Plazo inválido. Valores permitidos: ${VALORES_PERMITIDOS.plazoMeses.join(', ')}`);
  }

  // Validar tieneDeudas
  if (!VALORES_PERMITIDOS.tieneDeudas.includes(solicitud.tieneDeudas)) {
    errores.push(`Valor de tieneDeudas inválido. Debe ser "si" o "no"`);
  }

  // Validar montoDeudas condicional
  if (solicitud.tieneDeudas === 'si' && (!solicitud.montoDeudas || solicitud.montoDeudas.trim() === '')) {
    errores.push('El campo montoDeudas es requerido cuando tieneDeudas es "si"');
  }

  // Validar campos requeridos
  const camposRequeridos: (keyof SolicitudCredito)[] = [
    'nombreCompleto',
    'tipoDocumento',
    'numeroDocumento',
    'fechaNacimiento',
    'estadoCivil',
    'genero',
    'telefono',
    'email',
    'direccion',
    'ciudad',
    'departamento',
    'ocupacion',
    'empresa',
    'cargoActual',
    'tipoContrato',
    'ingresosMensuales',
    'tiempoEmpleo',
    'montoSolicitado',
    'plazoMeses',
    'proposito',
    'tieneDeudas',
    'refNombre1',
    'refTelefono1',
    'refRelacion1',
    'refNombre2',
    'refTelefono2',
    'refRelacion2',
  ];

  const camposFaltantes = camposRequeridos.filter(
    (campo) => !solicitud[campo] || solicitud[campo]?.toString().trim() === ''
  );

  if (camposFaltantes.length > 0) {
    errores.push(`Faltan campos requeridos: ${camposFaltantes.join(', ')}`);
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

// Preparar datos para enviar a la API
// Limpia y valida los datos para evitar problemas con Firestore
function prepararDatos(solicitud: SolicitudCredito): Record<string, string> {
  // Función helper para limpiar strings
  const limpiar = (valor: string | undefined | null): string => {
    if (!valor) return '';
    return valor.toString().trim();
  };

  // Función helper para limpiar números
  const limpiarNumero = (valor: string | number | undefined | null): string => {
    if (valor === null || valor === undefined) return '0';
    return valor.toString().replace(/\D/g, '') || '0';
  };

  const datos: Record<string, string> = {
    nombreCompleto: limpiar(solicitud.nombreCompleto),
    tipoDocumento: limpiar(solicitud.tipoDocumento),
    numeroDocumento: limpiar(solicitud.numeroDocumento),
    fechaNacimiento: limpiar(solicitud.fechaNacimiento),
    estadoCivil: limpiar(solicitud.estadoCivil),
    genero: limpiar(solicitud.genero),
    telefono: limpiar(solicitud.telefono),
    email: limpiar(solicitud.email).toLowerCase(),
    direccion: limpiar(solicitud.direccion),
    ciudad: limpiar(solicitud.ciudad),
    departamento: limpiar(solicitud.departamento),
    ocupacion: limpiar(solicitud.ocupacion),
    empresa: limpiar(solicitud.empresa),
    cargoActual: limpiar(solicitud.cargoActual),
    tipoContrato: limpiar(solicitud.tipoContrato),
    ingresosMensuales: limpiarNumero(solicitud.ingresosMensuales),
    tiempoEmpleo: limpiar(solicitud.tiempoEmpleo),
    montoSolicitado: limpiarNumero(solicitud.montoSolicitado),
    plazoMeses: limpiar(solicitud.plazoMeses),
    proposito: limpiar(solicitud.proposito),
    tieneDeudas: limpiar(solicitud.tieneDeudas),
    refNombre1: limpiar(solicitud.refNombre1),
    refTelefono1: limpiar(solicitud.refTelefono1),
    refRelacion1: limpiar(solicitud.refRelacion1),
    refNombre2: limpiar(solicitud.refNombre2),
    refTelefono2: limpiar(solicitud.refTelefono2),
    refRelacion2: limpiar(solicitud.refRelacion2),
  };

  // Agregar montoDeudas solo si tieneDeudas es "si" y tiene valor
  if (solicitud.tieneDeudas === 'si' && solicitud.montoDeudas) {
    const montoLimpio = limpiarNumero(solicitud.montoDeudas);
    if (montoLimpio && montoLimpio !== '0') {
      datos.montoDeudas = montoLimpio;
    }
  }

  // Asegurar que todos los valores sean strings válidos (no null, undefined, o objetos)
  // Firestore puede rechazar valores que no sean tipos primitivos válidos
  const datosLimpios: Record<string, string> = {};
  for (const [key, value] of Object.entries(datos)) {
    // Convertir a string y asegurar que no sea null/undefined
    if (value === null || value === undefined) {
      datosLimpios[key] = '';
    } else if (typeof value === 'object') {
      // Si es un objeto, convertirlo a JSON string (aunque no debería pasar)
      console.warn(`[API] Campo ${key} es un objeto, convirtiendo a string`);
      datosLimpios[key] = JSON.stringify(value);
    } else {
      datosLimpios[key] = String(value);
    }
  }

  return datosLimpios;
}

/**
 * Envía una solicitud de crédito a la API de Bancamia
 * @param solicitud - Datos de la solicitud de crédito
 * @returns Resultado del envío con éxito/error y mensajes
 */
export async function enviarSolicitudCredito(
  solicitud: SolicitudCredito
): Promise<EnvioResultado> {
  try {
    // Validar datos antes de enviar
    const validacion = validarDatos(solicitud);
    if (!validacion.valido) {
      return {
        success: false,
        message: 'Error de validación',
        errors: validacion.errores.map((error) => ({ message: error })),
      };
    }

    // Preparar datos para la API
    const datos = prepararDatos(solicitud);

    // Obtener URL de la API desde variables de entorno
    // En el cliente, usar el endpoint proxy de Next.js para evitar CORS
    const url = '/api/solicitudes';

    // Enviar request a través del proxy de Next.js
    // El proxy tiene timeout de 90 segundos, el cliente espera máximo 95 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 95000); // 95 segundos

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datos),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parsear respuesta (incluso si hay error)
      let result: ApiResponse;
      try {
        result = await response.json();
      } catch {
        // Si no es JSON, obtener texto
        const errorText = await response.text();
        throw new Error(`Error HTTP ${response.status}: ${errorText || 'Error desconocido'}`);
      }

      // Si hay error en la respuesta (504, 503, 500, etc.), procesarlo
      if (!response.ok) {
        // Si es un error de timeout (504), usar el mensaje del error
        if (response.status === 504 && result.error) {
          return {
            success: false,
            message: result.error.message || 'La solicitud tardó demasiado tiempo',
            errors: [{ 
              message: result.error.message || 'La solicitud está tardando más de lo esperado. Es posible que se haya procesado correctamente en el servidor.' 
            }],
          };
        }
        
        // Para otros errores, lanzar excepción para que se maneje en el catch
        throw new Error(`Error HTTP ${response.status}: ${result.error?.message || JSON.stringify(result)}`);
      }

      // Procesar respuesta exitosa
      if (response.ok && result.success && result.data) {
        return {
          success: true,
          id: result.data.id,
          message: result.message || 'Solicitud enviada exitosamente',
        };
      }

      // Procesar errores de la API
      const errores: Array<{ field?: string; message: string }> = [];

      if (result.error?.details?.errors) {
        result.error.details.errors.forEach((error) => {
          errores.push({
            field: error.field,
            message: error.message,
          });
        });
      }

      return {
        success: false,
        message: result.error?.message || 'Error al enviar la solicitud',
        errors: errores.length > 0 ? errores : [{ message: result.error?.message || 'Error desconocido' }],
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    // Error de red o conexión
    console.error('Error al conectar con la API:', error);
    
    let mensajeError = 'Error al conectar con el servidor. Por favor intenta de nuevo más tarde.';
    
    if (error instanceof Error) {
      // Error de timeout
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        mensajeError = 'La solicitud está tardando más de lo esperado. Es posible que se haya procesado correctamente en el servidor. Por favor verifica o intenta de nuevo.';
      }
      // Error de red
      else if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
        mensajeError = 'Error de conexión. Verifica tu conexión a internet y que la API esté disponible.';
      }
      // Otros errores
      else {
        mensajeError = error.message || mensajeError;
      }
    }
    
    return {
      success: false,
      message: mensajeError,
      errors: [{ message: mensajeError }],
    };
  }
}

