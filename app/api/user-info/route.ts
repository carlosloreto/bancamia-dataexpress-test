import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Obtener header IAP si existe
    const iapToken = request.headers.get('x-goog-iap-jwt-assertion');
    
    if (iapToken) {
      // Verificar y extraer info del token IAP
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/verify-iap`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: iapToken }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data.user);
      }
    }

    // Modo desarrollo: retornar usuario de prueba
    if (process.env.NODE_ENV === 'development') {
      const cookieStore = cookies();
      const session = cookieStore.get('iap_session');
      
      if (session?.value === 'dev_mode') {
        return NextResponse.json({
          email: 'admin@desarrollo.local',
          userId: 'dev-user-123',
          domain: 'desarrollo.local',
          verified: true,
          mode: 'development',
        });
      }
    }

    // Sin sesión
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
    
  } catch (error) {
    console.error('Error obteniendo info de usuario:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}

