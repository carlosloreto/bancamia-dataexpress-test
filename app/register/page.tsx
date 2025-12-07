'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { register, user, error, clearError } = useAuth();
  const router = useRouter();

  // Si ya está autenticado, redirigir a admin
  useEffect(() => {
    if (user) {
      router.push('/admin');
    }
  }, [user, router]);

  const validateForm = (): boolean => {
    setValidationError('');
    
    if (!name || !email || !password || !confirmPassword) {
      setValidationError('Todos los campos son requeridos');
      return false;
    }
    
    if (name.length < 3) {
      setValidationError('El nombre debe tener al menos 3 caracteres');
      return false;
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Email inválido');
      return false;
    }
    
    // Validar contraseña
    if (password.length < 6) {
      setValidationError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    
    if (password !== confirmPassword) {
      setValidationError('Las contraseñas no coinciden');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    clearError();
    
    try {
      await register({
        name,
        email,
        password,
      });
      
      // El registro hace login automático y redirige
      // router.push('/admin');
    } catch (err) {
      console.error('Error en registro:', err);
      // El error ya se maneja en el contexto
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = validationError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bancamia-azul-oscuro to-bancamia-azul-medio py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Image
            src="/Bancamia2-300x99.png"
            alt="Bancamía"
            width={200}
            height={66}
            className="mx-auto"
            priority
          />
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-sm text-gray-200">
            Regístrate para acceder al panel de administración
          </p>
        </div>

        {/* Formulario */}
        <form className="mt-8 space-y-6 bg-white rounded-md shadow-xl p-8" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-bancamia-rojo focus:border-transparent focus:z-10 sm:text-sm"
                placeholder="Juan Pérez"
                disabled={isSubmitting}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-bancamia-rojo focus:border-transparent focus:z-10 sm:text-sm"
                placeholder="tu@email.com"
                disabled={isSubmitting}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-bancamia-rojo focus:border-transparent focus:z-10 sm:text-sm"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                Mínimo 6 caracteres
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-bancamia-rojo focus:border-transparent focus:z-10 sm:text-sm"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Error */}
          {displayError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{displayError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Botón de submit */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting || !name || !email || !password || !confirmPassword}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-bancamia-rojo to-bancamia-rojo-claro hover:from-bancamia-rojo-oscuro hover:to-bancamia-rojo focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bancamia-rojo disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando cuenta...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </div>

          {/* Link a login */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="font-medium text-bancamia-rojo hover:text-bancamia-rojo-oscuro">
                Inicia sesión aquí
              </Link>
            </p>
          </div>

          {/* Link a home */}
          <div className="text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-bancamia-azul-oscuro">
              ← Volver al formulario público
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

