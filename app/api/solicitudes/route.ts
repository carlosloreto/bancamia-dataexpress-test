import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint para enviar solicitudes a la API de Bancamia
 * Evita problemas de CORS y permite manejar errores del servidor
 * POST /api/solicitudes
 */
export async function POST(request: NextRequest) {
  // Variables para tracking de tiempo (necesarias en el catch)
  const timeoutMs = 180000; // 180 segundos = 3 minutos
  const startTime = Date.now();
  
  try {
    // Obtener datos del body
    const datos = await request.json();

    // Obtener URL de la API desde variables de entorno
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      console.error('[API Proxy] ERROR: NEXT_PUBLIC_API_URL no está configurada en las variables de entorno');
      return NextResponse.json(
        {
          success: false,
          error: {
            name: 'ConfigurationError',
            message: 'La URL de la API no está configurada. Configura NEXT_PUBLIC_API_URL en .env.local',
            statusCode: 500,
          },
        },
        { status: 500 }
      );
    }
    
    // Asegurar que la URL no termine con /
    const apiUrlClean = apiUrl.replace(/\/$/, '');
    const url = `${apiUrlClean}/api/v1/solicitudes`;

    console.log(`[API Proxy] Enviando solicitud a: ${url}`);
    console.log(`[API Proxy] API URL configurada: ${apiUrl}`);
    console.log(`[API Proxy] URL completa: ${url}`);
    console.log(`[API Proxy] Método: POST`);
    console.log(`[API Proxy] Tamaño del body: ${JSON.stringify(datos).length} bytes`);
    console.log(`[API Proxy] Datos:`, JSON.stringify(datos, null, 2));

    // Crear AbortController para manejar timeout manualmente
    // Aumentado a 180 segundos (3 minutos) para dar más tiempo a Cloud Run
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[API Proxy] Timeout alcanzado después de ${timeoutMs/1000} segundos, abortando request...`);
      controller.abort();
    }, timeoutMs);
    
    console.log(`[API Proxy] Iniciando request a las ${new Date().toISOString()}`);

    try {
      // Enviar request a la API de Bancamia
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datos),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[API Proxy] Respuesta recibida después de ${elapsedTime}s: ${response.status} ${response.statusText}`);

      // Obtener respuesta
      const contentType = response.headers.get('content-type');
      let result;

      // Si hay error (4xx, 5xx), manejar apropiadamente
      if (!response.ok) {
        const text = await response.text();
        console.error(`[API Proxy] Error ${response.status} de la API: ${text}`);
        console.error(`[API Proxy] Tiempo transcurrido: ${elapsedTime}s`);
        
        // Si es 503, puede ser timeout de Cloud Run o servicio no disponible
        if (response.status === 503) {
          console.error(`[API Proxy] 503 Service Unavailable - Posibles causas:`);
          console.error(`[API Proxy] 1. Timeout de Cloud Run (verifica que esté en 300s)`);
          console.error(`[API Proxy] 2. La instancia se reinició durante el request`);
          console.error(`[API Proxy] 3. Error en el código de la API que causó crash`);
          console.error(`[API Proxy] 4. Problema de recursos (memoria/CPU)`);
        }
        
        // Intentar parsear como JSON si es posible
        try {
          result = JSON.parse(text);
        } catch {
          // Si no es JSON, crear un objeto de error
          result = {
            success: false,
            error: {
              name: response.status === 503 ? 'ServiceUnavailable' : 'ServerError',
              message: response.status === 503 
                ? 'El servidor no está disponible o tardó demasiado en responder. La solicitud puede haberse procesado correctamente. Verifica en los logs de Cloud Run.'
                : text || `Error ${response.status}: ${response.statusText}`,
              statusCode: response.status,
              details: response.status === 503 
                ? 'Cloud Run puede haber alcanzado su timeout o la instancia tuvo un error. Revisa los logs de Cloud Run para más detalles.'
                : undefined,
            },
          };
        }
        
        // Retornar el error con el mismo status code
        return NextResponse.json(result, { status: response.status });
      }

      // Si es exitoso, parsear como JSON
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        // Si no es JSON pero es exitoso, crear respuesta
        result = {
          success: true,
          message: text || 'Solicitud procesada',
        };
      }

      // Retornar respuesta con el mismo status code
      return NextResponse.json(result, { status: response.status });
    } finally {
      clearTimeout(timeoutId);
    }

  } catch (error) {
    console.error('Error en proxy de solicitudes:', error);
    console.error('Error completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    // Manejar diferentes tipos de errores
    if (error instanceof Error) {
      // Verificar primero el código del error (más específico)
      interface ErrorWithCode extends Error {
        code?: string;
        cause?: {
          code?: string;
          message?: string;
        };
      }
      const errorWithCode = error as ErrorWithCode;
      const errorCode = errorWithCode.code;
      const errorCause = errorWithCode.cause;
      const causeCode = errorCause?.code;
      
      // Error de SSL/TLS - Verificar PRIMERO antes de otros errores
      if (errorCode === 'ERR_SSL_WRONG_VERSION_NUMBER' || 
          causeCode === 'ERR_SSL_WRONG_VERSION_NUMBER' ||
          error.message.includes('SSL routines') ||
          error.message.includes('wrong version number') ||
          (errorCause && errorCause.message && errorCause.message.includes('SSL'))) {
        console.error('[API Proxy] Error SSL/TLS detectado');
        console.error('[API Proxy] Código del error:', errorCode || causeCode);
        console.error('[API Proxy] Verifica que la URL de la API sea correcta y use HTTPS');
        console.error('[API Proxy] URL que se intentó usar:', process.env.NEXT_PUBLIC_API_URL || 'no configurada');
        return NextResponse.json(
          {
            success: false,
            error: {
              name: 'SSLError',
              message: 'Error de conexión SSL con el servidor. Verifica que la URL de la API sea correcta y use HTTPS.',
              statusCode: 503,
              details: 'El servidor puede no estar respondiendo con HTTPS correctamente. Verifica la URL en .env.local',
              url: process.env.NEXT_PUBLIC_API_URL || 'no configurada',
            },
          },
          { status: 503 }
        );
      }

      // Error de timeout
      if (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('aborted')) {
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`[API Proxy] Timeout: La API no respondió en ${timeoutMs/1000} segundos (tiempo transcurrido: ${elapsedTime}s)`);
        console.error('[API Proxy] NOTA: La solicitud puede haberse procesado correctamente en el backend.');
        console.error('[API Proxy] NOTA: Verifica en la base de datos si el registro se creó.');
        console.error('[API Proxy] DIAGNÓSTICO: Revisa los logs de Cloud Run para ver qué está pasando en el backend.');
        return NextResponse.json(
          {
            success: false,
            error: {
              name: 'TimeoutError',
              message: 'La solicitud está tardando más de lo esperado. Es posible que se haya procesado correctamente. Por favor verifica o intenta de nuevo en unos momentos.',
              statusCode: 504,
              note: 'La solicitud puede haberse procesado en el backend a pesar del timeout. Verifica en la base de datos.',
            },
          },
          { status: 504 }
        );
      }

      // Error de red (solo si NO es SSL)
      if (error.message.includes('fetch') || error.message.includes('network') || 
          error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        console.error('[API Proxy] Error de red:', error);
        return NextResponse.json(
          {
            success: false,
            error: {
              name: 'NetworkError',
              message: 'Error de conexión con el servidor. Verifica tu conexión a internet y que la API esté disponible.',
              statusCode: 503,
              details: error.message,
            },
          },
          { status: 503 }
        );
      }

      // Otros errores
      return NextResponse.json(
        {
          success: false,
          error: {
            name: 'ServerError',
            message: error.message || 'Error al procesar la solicitud',
            statusCode: 500,
          },
        },
        { status: 500 }
      );
    }

    // Error desconocido
    return NextResponse.json(
      {
        success: false,
        error: {
          name: 'UnknownError',
          message: 'Error desconocido al procesar la solicitud',
          statusCode: 500,
        },
      },
      { status: 500 }
    );
  }
}

