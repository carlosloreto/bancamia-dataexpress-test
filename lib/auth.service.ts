// Servicio de autenticación que integra Firebase Auth con la API backend

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebase';
import { api } from './api-client';

// Tipos para usuario
export interface User {
  uid: string;
  email: string;
  name?: string;
  role?: string;
  createdAt?: string;
}

// Tipos para respuestas de autenticación
export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

/**
 * FLUJO DE AUTENTICACIÓN:
 * 1. Usuario ingresa email/password en el frontend
 * 2. Frontend autentica con Firebase Auth (obtiene idToken)
 * 3. Frontend envía idToken a POST /api/v3/auth/login
 * 4. Backend valida el token y retorna user + token JWT
 * 5. Frontend usa idToken de Firebase para peticiones protegidas
 * 6. Firebase renueva automáticamente el token cuando expire
 */

class AuthService {
  private currentFirebaseUser: FirebaseUser | null = null;

  /**
   * Obtener el idToken actual de Firebase
   * Renueva automáticamente si es necesario
   */
  async getIdToken(forceRefresh = false): Promise<string | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    try {
      const idToken = await user.getIdToken(forceRefresh);
      return idToken;
    } catch (error) {
      console.error('❌ Error al obtener idToken:', error);
      return null;
    }
  }

  /**
   * Establecer el usuario actual de Firebase
   * Se llama desde AuthContext cuando cambia el estado de autenticación
   */
  setCurrentFirebaseUser(user: FirebaseUser | null): void {
    this.currentFirebaseUser = user;
  }

  /**
   * Login: Autentica con Firebase y luego sincroniza con el backend
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log('🔐 Iniciando login...');
      
      // 1. Autenticar con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log('✅ Autenticado con Firebase:', firebaseUser.email);
      
      // 2. Obtener idToken de Firebase
      const idToken = await firebaseUser.getIdToken();
      
      console.log('🎫 Token de Firebase obtenido');
      
      // 3. Enviar idToken al backend para sincronizar con Firestore
      const response = await api.post<LoginResponse>('/api/v3/auth/login', {
        idToken,
      });
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Error al autenticar con el backend');
      }
      
      console.log('✅ Sincronizado con el backend');
      
      // 4. Guardar usuario en localStorage (el token se maneja automáticamente)
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Error en login:', error);
      
      if (error instanceof Error) {
        // Errores de Firebase
        if (error.message.includes('auth/user-not-found')) {
          throw new Error('Usuario no encontrado');
        }
        if (error.message.includes('auth/wrong-password')) {
          throw new Error('Contraseña incorrecta');
        }
        if (error.message.includes('auth/invalid-email')) {
          throw new Error('Email inválido');
        }
        if (error.message.includes('auth/user-disabled')) {
          throw new Error('Usuario deshabilitado');
        }
        if (error.message.includes('auth/too-many-requests')) {
          throw new Error('Demasiados intentos. Intenta más tarde');
        }
        
        throw error;
      }
      
      throw new Error('Error desconocido al iniciar sesión');
    }
  }

  /**
   * Register: Crea usuario en Firebase y luego en el backend
   * Envía solo { email, password, displayName } según especificaciones
   */
  async register(data: RegisterData): Promise<User> {
    try {
      console.log('📝 Iniciando registro...');
      
      // 1. Crear usuario en Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const firebaseUser = userCredential.user;
      
      console.log('✅ Usuario creado en Firebase:', firebaseUser.email);
      
      // 2. Actualizar perfil con nombre (displayName)
      if (data.name) {
        await updateProfile(firebaseUser, {
          displayName: data.name,
        });
      }
      
      // 3. Registrar en el backend con solo { email, password, displayName }
      // El idToken se envía en el header Authorization automáticamente por api-client
      // api-client obtiene el token de auth.currentUser automáticamente
      const response = await api.post<{ user: User }>('/api/v3/auth/register', {
        email: data.email,
        password: data.password,
        displayName: data.name,
      });
      
      if (!response.success) {
        // Si falla el registro en el backend, eliminar usuario de Firebase
        try {
          await firebaseUser.delete();
        } catch {
          // Ignorar error al eliminar usuario
        }
        throw new Error(response.error?.message || 'Error al registrar en el backend');
      }
      
      console.log('✅ Usuario registrado en el backend');
      
      // Guardar usuario en localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data.user;
    } catch (error: unknown) {
      console.error('❌ Error en registro:', error);
      
      if (error instanceof Error) {
        // Errores de Firebase
        if (error.message.includes('auth/email-already-in-use')) {
          throw new Error('El email ya está registrado');
        }
        if (error.message.includes('auth/invalid-email')) {
          throw new Error('Email inválido');
        }
        if (error.message.includes('auth/weak-password')) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        
        throw error;
      }
      
      throw new Error('Error desconocido al registrarse');
    }
  }

  /**
   * Verify: Verifica el idToken con el backend
   */
  async verify(idToken: string): Promise<User> {
    try {
      console.log('🔍 Verificando token...');
      
      const response = await api.post<{ user: User }>('/api/v3/auth/verify', {
        idToken,
      });
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Error al verificar token');
      }
      
      console.log('✅ Token verificado');
      
      // Actualizar usuario en localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data.user;
    } catch (error) {
      console.error('❌ Error al verificar token:', error);
      throw error;
    }
  }

  /**
   * Logout: Cierra sesión en Firebase y limpia datos locales
   */
  async logout(): Promise<void> {
    try {
      console.log('👋 Cerrando sesión...');
      
      // 1. Cerrar sesión en Firebase
      await firebaseSignOut(auth);
      
      // 2. Limpiar datos locales
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
      
      this.currentFirebaseUser = null;
      
      console.log('✅ Sesión cerrada');
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      throw error;
    }
  }

  /**
   * Obtener perfil del usuario desde el backend
   */
  async getProfile(): Promise<User> {
    try {
      const response = await api.get<{ user: User }>('/api/v3/auth/me');
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Error al obtener perfil');
      }
      
      // Actualizar usuario en localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data.user;
    } catch (error) {
      console.error('❌ Error al obtener perfil:', error);
      throw error;
    }
  }

  /**
   * Verificar si hay un usuario autenticado
   */
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') {
      return null;
    }
    
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return null;
    }
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return auth.currentUser !== null && this.getCurrentUser() !== null;
  }
}

// Exportar instancia única
const authService = new AuthService();
export default authService;

