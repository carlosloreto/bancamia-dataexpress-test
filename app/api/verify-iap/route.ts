import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

const oauth2Client = new OAuth2Client();

interface IAPPayload {
  email: string;
  sub: string;
  hd?: string; // Hosted domain (para Google Workspace)
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token requerido' },
        { status: 400 }
      );
    }

    // Verificar token IAP de GCP
    const payload = await verifyIAPToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Retornar información del usuario
    return NextResponse.json({
      success: true,
      user: {
        email: payload.email,
        userId: payload.sub,
        domain: payload.hd || 'gmail.com',
        verified: true,
      },
    });
    
  } catch (error) {
    console.error('Error verificando IAP token:', error);
    return NextResponse.json(
      { error: 'Error al verificar token' },
      { status: 500 }
    );
  }
}

async function verifyIAPToken(token: string): Promise<IAPPayload | null> {
  try {
    // IAP Audience - debe coincidir con tu configuración de GCP
    // Formato: /projects/PROJECT_NUMBER/apps/PROJECT_ID
    const audience = process.env.IAP_AUDIENCE;
    
    if (!audience) {
      console.warn('⚠️ IAP_AUDIENCE no configurado. Define en .env.local');
      // En desarrollo, solo decodificar sin verificar
      if (process.env.NODE_ENV === 'development') {
        const decoded = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64').toString()
        );
        return decoded as IAPPayload;
      }
      return null;
    }

    // Verificar el token JWT de IAP
    const ticket = await oauth2Client.verifyIdToken({
      idToken: token,
      audience: audience,
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      return null;
    }

    // Verificar que el issuer sea de Google IAP
    const validIssuers = [
      'https://cloud.google.com/iap',
      'accounts.google.com',
    ];
    
    if (!validIssuers.includes(payload.iss)) {
      console.error('❌ Issuer inválido:', payload.iss);
      return null;
    }

    return payload as IAPPayload;
    
  } catch (error) {
    console.error('Error al verificar token IAP:', error);
    return null;
  }
}

// Endpoint GET para pruebas
export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de verificación IAP',
    status: 'ready',
    config: {
      iapAudienceConfigured: !!process.env.IAP_AUDIENCE,
      nodeEnv: process.env.NODE_ENV,
    },
  });
}

