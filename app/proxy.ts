import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Proxy para verificar autenticación IAP de GCP
export function proxy(request: NextRequest) {
  // Solo proteger rutas /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // 1. Verificar header de IAP (x-goog-iap-jwt-assertion)
    const iapToken = request.headers.get('x-goog-iap-jwt-assertion');
    
    // 2. También verificar token en query param (para pruebas)
    const tokenParam = request.nextUrl.searchParams.get('token');
    
    // 3. O verificar cookie de sesión existente
    const sessionCookie = request.cookies.get('iap_session');
    
    // Para desarrollo/pruebas: permitir token simple
    const devToken = process.env.DEV_ADMIN_TOKEN;
    
    if (tokenParam === devToken && devToken) {
      // Modo desarrollo: guardar sesión
      const response = NextResponse.next();
      response.cookies.set('iap_session', 'dev_mode', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
      });
      return response;
    }
    
    if (sessionCookie?.value === 'dev_mode') {
      // Ya tiene sesión en modo desarrollo
      return NextResponse.next();
    }
    
    // En producción: verificar IAP token
    if (iapToken) {
      // IAP está activo, pasar al handler de verificación
      const response = NextResponse.next();
      
      // Reescribir a ruta interna que maneja la verificación
      const url = request.nextUrl.clone();
      url.searchParams.set('iap_token', iapToken);
      
      return response;
    }
    
    // Si estamos en desarrollo local y no hay IAP
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Modo desarrollo: IAP no está activo');
      console.log('💡 Usa ?token=' + (devToken || 'configura DEV_ADMIN_TOKEN'));
      
      // Permitir acceso en desarrollo sin IAP
      return NextResponse.next();
    }
    
    // No autorizado: redirigir a home
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

