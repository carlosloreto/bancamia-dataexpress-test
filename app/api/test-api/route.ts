import { NextResponse } from 'next/server';

/**
 * Endpoint de prueba para verificar la conexión con la API de Bancamia
 * GET /api/test-api
 */
export async function GET() {
  try {
    // Obtener URL de la API desde variables de entorno
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'NEXT_PUBLIC_API_URL no está configurada en las variables de entorno',
          config: {
            envVarSet: false,
            envVarValue: 'no configurada',
            message: 'Configura NEXT_PUBLIC_API_URL en .env.local',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
    
    // Probar health check de la API
    const healthUrl = `${apiUrl}/health`;
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Timeout de 10 segundos
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json();

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      apiUrl: apiUrl,
      healthCheck: {
        url: healthUrl,
        response: data,
      },
      config: {
        envVarSet: !!process.env.NEXT_PUBLIC_API_URL,
        envVarValue: process.env.NEXT_PUBLIC_API_URL || 'usando valor por defecto',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'no configurada',
        config: {
          envVarSet: !!process.env.NEXT_PUBLIC_API_URL,
          envVarValue: process.env.NEXT_PUBLIC_API_URL || 'no configurada',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

