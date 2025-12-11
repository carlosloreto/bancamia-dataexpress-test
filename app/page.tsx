"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { initialFormData, AutorizacionDatos } from "@/lib/types";
import { ciudadesNegocio } from "@/lib/ciudades-negocio";
import { autorizacionTratamientoDatos, autorizacionContacto } from "@/lib/authorizations";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<AutorizacionDatos>(initialFormData);
  const [enviado, setEnviado] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarAutorizacionCompleta, setMostrarAutorizacionCompleta] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Funciones de validación para Colombia
  const validateNombreCompleto = (nombre: string): string | null => {
    if (!nombre.trim()) {
      return "El nombre completo es obligatorio";
    }
    if (nombre.trim().length < 3) {
      return "El nombre debe tener al menos 3 caracteres";
    }
    if (nombre.trim().length > 100) {
      return "El nombre no puede exceder 100 caracteres";
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nombre.trim())) {
      return "El nombre solo puede contener letras y espacios";
    }
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
      return "El correo electrónico es obligatorio";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Ingrese un correo electrónico válido (ejemplo: correo@dominio.com)";
    }
    return null;
  };

  const validateNumeroDocumento = (numero: string, tipo: string): string | null => {
    if (!numero.trim()) {
      return "El número de documento es obligatorio";
    }

    const numeroLimpio = numero.replace(/\s/g, '');

    switch (tipo) {
      case "CC": // Cédula de Ciudadanía
        if (!/^\d+$/.test(numeroLimpio)) {
          return "La cédula de ciudadanía solo puede contener números";
        }
        if (numeroLimpio.length < 8 || numeroLimpio.length > 10) {
          return "La cédula de ciudadanía debe tener entre 8 y 10 dígitos";
        }
        break;
      case "CE": // Cédula de Extranjería
        if (numeroLimpio.length < 6 || numeroLimpio.length > 10) {
          return "La cédula de extranjería debe tener entre 6 y 10 caracteres";
        }
        break;
      case "PA": // Pasaporte
        if (numeroLimpio.length < 6 || numeroLimpio.length > 12) {
          return "El pasaporte debe tener entre 6 y 12 caracteres";
        }
        break;
      case "PEP": // Permiso Especial de Permanencia
        if (numeroLimpio.length < 6 || numeroLimpio.length > 12) {
          return "El PEP debe tener entre 6 y 12 caracteres";
        }
        break;
      case "PPP": // Permiso de Protección Personal
        if (numeroLimpio.length < 6 || numeroLimpio.length > 12) {
          return "El PPP debe tener entre 6 y 12 caracteres";
        }
        break;
    }
    return null;
  };

  const validateFechaNacimiento = (fecha: string): string | null => {
    if (!fecha) {
      return "La fecha de nacimiento es obligatoria";
    }
    const fechaNac = new Date(fecha);
    const hoy = new Date();
    const edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mesDiferencia = hoy.getMonth() - fechaNac.getMonth();

    if (fechaNac > hoy) {
      return "La fecha de nacimiento no puede ser futura";
    }

    const edadReal = mesDiferencia < 0 || (mesDiferencia === 0 && hoy.getDate() < fechaNac.getDate())
      ? edad - 1
      : edad;

    if (edadReal < 18) {
      return "Debe ser mayor de 18 años para realizar esta solicitud";
    }

    if (edadReal > 100) {
      return "Por favor verifique la fecha de nacimiento";
    }

    return null;
  };

  const validateFechaExpedicion = (fecha: string): string | null => {
    if (!fecha) {
      return "La fecha de expedición es obligatoria";
    }
    const fechaExp = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaExp > hoy) {
      return "La fecha de expedición no puede ser futura";
    }

    const fechaMinima = new Date();
    fechaMinima.setFullYear(fechaMinima.getFullYear() - 50);

    if (fechaExp < fechaMinima) {
      return "La fecha de expedición no puede ser anterior a hace 50 años";
    }

    return null;
  };

  const validateCelular = (celular: string): string | null => {
    if (!celular.trim()) {
      return "El número de celular es obligatorio";
    }
    const numeroLimpio = celular.replace(/\s/g, '').replace(/-/g, '');

    if (!/^\d+$/.test(numeroLimpio)) {
      return "El celular solo puede contener números";
    }

    if (numeroLimpio.length !== 10) {
      return "El celular debe tener exactamente 10 dígitos";
    }

    return null;
  };

  const validateDireccion = (direccion: string): string | null => {
    if (!direccion.trim()) {
      return "La dirección es obligatoria";
    }
    if (direccion.trim().length < 5) {
      return "La dirección debe tener al menos 5 caracteres";
    }
    if (direccion.trim().length > 200) {
      return "La dirección no puede exceder 200 caracteres";
    }
    return null;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      // Limpiar error del checkbox
      if (checked) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Validar en tiempo real
      let error: string | null = null;

      if (name === 'nombreCompleto') {
        error = validateNombreCompleto(value);
      } else if (name === 'email') {
        error = validateEmail(value);
      } else if (name === 'numeroDocumento') {
        error = validateNumeroDocumento(value, formData.tipoDocumento);
      } else if (name === 'tipoDocumento') {
        // Si cambia el tipo, validar el número de documento con el nuevo tipo
        if (formData.numeroDocumento) {
          error = validateNumeroDocumento(formData.numeroDocumento, value);
          // Actualizar el error del número de documento también
          setFieldErrors((prev) => {
            const newErrors = { ...prev };
            if (error) {
              newErrors.numeroDocumento = error;
            } else {
              delete newErrors.numeroDocumento;
            }
            return newErrors;
          });
        }
      } else if (name === 'fechaNacimiento') {
        error = validateFechaNacimiento(value);
      } else if (name === 'fechaExpedicionDocumento') {
        error = validateFechaExpedicion(value);
      } else if (name === 'celularNegocio') {
        error = validateCelular(value);
      } else if (name === 'direccionNegocio') {
        error = validateDireccion(value);
      }

      // Actualizar errores
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[name] = error;
        } else {
          delete newErrors[name];
        }
        return newErrors;
      });
    }
  };

  // Función para llenar el formulario con datos de prueba
  const llenarDatosPrueba = () => {
    const hoy = new Date();
    const fechaNacimiento = new Date(hoy.getFullYear() - 25, hoy.getMonth(), hoy.getDate());
    const fechaExpedicion = new Date(hoy.getFullYear() - 5, hoy.getMonth(), hoy.getDate());

    setFormData({
      email: "juan.perez@email.com",
      autorizacionTratamientoDatos: true,
      autorizacionContacto: true,
      nombreCompleto: "Juan Pérez García",
      tipoDocumento: "CC",
      numeroDocumento: "1234567890",
      fechaNacimiento: fechaNacimiento.toISOString().split('T')[0],
      fechaExpedicionDocumento: fechaExpedicion.toISOString().split('T')[0],
      ciudadNegocio: "201", // Plaza Minorista
      direccionNegocio: "Calle 123 #45-67",
      celularNegocio: "3001234567",
    });

    setError(null);
    setEnviado(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos los campos
    const errors: Record<string, string> = {};

    const nombreError = validateNombreCompleto(formData.nombreCompleto);
    if (nombreError) errors.nombreCompleto = nombreError;

    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;

    const docError = validateNumeroDocumento(formData.numeroDocumento, formData.tipoDocumento);
    if (docError) errors.numeroDocumento = docError;

    const fechaNacError = validateFechaNacimiento(formData.fechaNacimiento);
    if (fechaNacError) errors.fechaNacimiento = fechaNacError;

    const fechaExpError = validateFechaExpedicion(formData.fechaExpedicionDocumento);
    if (fechaExpError) errors.fechaExpedicionDocumento = fechaExpError;

    const celularError = validateCelular(formData.celularNegocio);
    if (celularError) errors.celularNegocio = celularError;

    const direccionError = validateDireccion(formData.direccionNegocio);
    if (direccionError) errors.direccionNegocio = direccionError;

    if (!formData.ciudadNegocio) {
      errors.ciudadNegocio = "Debe seleccionar una ciudad";
    }

    // Validar autorizaciones
    if (!formData.autorizacionTratamientoDatos) {
      errors.autorizacionTratamientoDatos = "Debe aceptar la autorización de tratamiento de datos";
    }

    if (!formData.autorizacionContacto) {
      errors.autorizacionContacto = "Debe aceptar la autorización de contacto";
    }

    // Si hay errores, mostrarlos y detener el envío
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Por favor corrija los errores en el formulario antes de enviar.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      // Obtener userId y token del usuario autenticado si existe
      let userId: string | null = null;
      let idToken: string | null = null;

      try {
        const user = auth.currentUser;
        if (user) {
          userId = user.uid;
          // Obtener el token de autenticación
          idToken = await user.getIdToken();
        }
      } catch {
        console.log('No hay usuario autenticado, userId y token serán null');
      }

      // Preparar datos para enviar, incluyendo userId
      const datosParaEnviar = {
        ...formData,
        userId: userId,
      };

      // Preparar headers con token si existe
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      // Enviar datos a la API
      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers,
        body: JSON.stringify(datosParaEnviar),
      });

      const result = await response.json();

      if (!response.ok) {
        // Manejar errores de la API
        const errorMessage = result.error?.message || 'Error al enviar el formulario';
        setError(errorMessage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Éxito
      setEnviado(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      setError("Hubo un error inesperado al enviar el formulario. Por favor intenta de nuevo.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  // Si el formulario fue enviado exitosamente, mostrar pantalla de agradecimiento
  if (enviado) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Bancamía */}
        <header className="bg-white shadow-sm">
          <div className="py-3 md:py-6">
            <div className="flex items-center justify-center gap-4 md:gap-6">
              <Image
                src="/Bancamia2-300x99.png"
                alt="Bancamía - El Banco de los que creen"
                width={220}
                height={73}
                priority
                className="h-auto w-[200px] md:w-[220px] -ml-4 md:ml-0"
              />
              <Image
                src="/FMF.png"
                alt="Fundación BBVA Microfinanzas"
                width={300}
                height={75}
                priority
                className="hidden md:block h-auto w-auto max-h-16"
              />
            </div>
          </div>
        </header>

        {/* Banner Mejorado */}
        <div className="relative text-white py-8 md:py-12 overflow-hidden">
          {/* Imagen de fondo con blur */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url('/unnamed (3).jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter: 'blur(15px)',
              transform: 'scale(1.05)',
              zIndex: 0,
            }}
          ></div>

          {/* Overlay oscuro suave para legibilidad (reducido para que se vea la imagen) */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A5F]/60 via-[#2D5F8D]/50 to-[#1E3A5F]/60 z-10"></div>

          {/* Patrón de fondo decorativo sutil */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-5 z-10"></div>

          {/* Círculos decorativos de fondo */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-bancamia-rojo rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob z-10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-bancamia-azul-claro rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000 z-10"></div>
          <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-bancamia-rojo-claro rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000 z-10"></div>

          {/* Contenido del banner */}
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 z-20">
            <div className="text-center">
              {/* Título principal */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-2 leading-tight">
                <span className="block text-white drop-shadow-2xl mb-1">
                  ¡Gracias por tu Confianza!
                </span>
                <span className="block text-white drop-shadow-2xl text-2xl md:text-3xl lg:text-4xl">
                  Tu información ha sido recibida
                </span>
              </h1>

              {/* Descripción */}
              <div className="max-w-3xl mx-auto mb-0">
                <p className="text-sm md:text-base text-blue-100 leading-relaxed px-2">
                  Hemos recibido tu autorización exitosamente.
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Contenido de agradecimiento */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white shadow-xl rounded-2xl p-8 md:p-10 animate-fade-in">
            {/* Icono de éxito grande */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl animate-fade-in">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Mensaje principal */}
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1E3A5F] mb-4">
                ¡Autorización Enviada Exitosamente!
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Gracias por completar el formulario de autorización de datos. Tu información ha sido registrada correctamente y será procesada por nuestro equipo.
              </p>
            </div>

            {/* Información adicional */}
            <div className="bg-gradient-to-br from-blue-50 to-gray-50 rounded-lg p-6 mb-8 border-2 border-blue-200">
              <h3 className="text-xl font-bold text-[#1E3A5F] mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-bancamia-rojo" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Próximos Pasos
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Nuestro equipo revisará tu solicitud en las próximas horas.</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Recibirás un correo electrónico de confirmación a la dirección proporcionada.</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Un asesor se pondrá en contacto contigo para continuar con el proceso.</span>
                </li>
              </ul>
            </div>

            {/* Información de contacto */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-[#1E3A5F] mb-4">
                ¿Necesitas ayuda?
              </h3>
              <p className="text-gray-700 mb-4">
                Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos:
              </p>
              <div className="flex flex-col md:flex-row gap-4 text-sm">
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-bancamia-rojo mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span className="font-semibold">Línea de atención</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-bancamia-rojo mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span className="font-semibold">servicio@bancamia.com.co</span>
                </div>
              </div>
            </div>

            {/* Botón para volver */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setFormData(initialFormData);
                  setEnviado(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group px-8 py-3 bg-gradient-to-r from-bancamia-rojo to-bancamia-rojo-claro hover:from-bancamia-rojo-oscuro hover:to-bancamia-rojo text-white font-bold rounded-md shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-bancamia-rojo/50"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Volver al Inicio</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-[#1E3A5F] to-[#2D5F8D] text-white mt-16 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-sm">
              <p>© Copyright 2025 – Bancamía. Todos los derechos reservados.</p>
              <p className="mt-2 text-xs text-blue-200">El Banco de los que creen - Transformando realidades</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bancamía */}
      <header className="bg-white shadow-sm">
        <div className="py-3 md:py-6">
          <div className="flex items-center justify-center gap-4 md:gap-6">
            <Image
              src="/Bancamia2-300x99.png"
              alt="Bancamía - El Banco de los que creen"
              width={220}
              height={73}
              priority
              className="h-auto w-[200px] md:w-[220px] -ml-4 md:ml-0"
            />
            <Image
              src="/FMF.png"
              alt="Fundación BBVA Microfinanzas"
              width={300}
              height={75}
              priority
              className="hidden md:block h-auto w-auto max-h-16"
            />
          </div>
        </div>
      </header>

      {/* Banner Mejorado */}
      <div className="relative text-white py-8 md:py-12 overflow-hidden">
        {/* Imagen de fondo con blur */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('/unnamed (3).jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(15px)',
            transform: 'scale(1.05)',
            zIndex: 0,
          }}
        ></div>

        {/* Overlay oscuro suave para legibilidad (reducido para que se vea la imagen) */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A5F]/60 via-[#2D5F8D]/50 to-[#1E3A5F]/60 z-10"></div>

        {/* Patrón de fondo decorativo sutil */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-5 z-10"></div>

        {/* Círculos decorativos de fondo */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-bancamia-rojo rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob z-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-bancamia-azul-claro rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000 z-10"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-bancamia-rojo-claro rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000 z-10"></div>

        {/* Contenido del banner */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 z-20">
          <div className="text-center">
            {/* Título principal */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-2 leading-tight">
              <span className="block text-white drop-shadow-2xl mb-1">
                Autorización de Datos
              </span>
              <span className="block text-white drop-shadow-2xl text-2xl md:text-3xl lg:text-4xl">
                ¡Tu crédito te espera!
              </span>
            </h1>

            {/* Descripción */}
            <div className="max-w-3xl mx-auto mb-0">
              <p className="text-sm md:text-base text-blue-100 leading-relaxed px-2">
                Completa el formulario para autorizar la consulta en centrales de riesgo.
              </p>
            </div>

          </div>
        </div>

      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mensaje de error */}
        {error && (
          <div className="mb-8 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl shadow-xl p-6 animate-fade-in">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">Error al Enviar</h3>
                <p className="text-red-100 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-white hover:text-red-200 transition-colors"
                aria-label="Cerrar mensaje de error"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-8 md:p-10">
          {/* Información Personal */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-bancamia-rojo to-bancamia-rojo-claro text-white font-bold text-lg shadow-lg mr-3">
                1
              </div>
              <h2 className="text-xl font-bold text-[#1E3A5F]">
                Información Personal
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombreCompleto"
                  value={formData.nombreCompleto}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border-2 rounded-md text-gray-800 focus:ring-2 focus:ring-bancamia-rojo transition-all ${fieldErrors.nombreCompleto
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-bancamia-rojo'
                    }`}
                  placeholder="Juan Pérez García"
                />
                {fieldErrors.nombreCompleto && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.nombreCompleto}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border-2 rounded-md text-gray-800 focus:ring-2 focus:ring-bancamia-rojo transition-all ${fieldErrors.email
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-bancamia-rojo'
                    }`}
                  placeholder="correo@ejemplo.com"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento <span className="text-red-500">*</span>
                </label>
                <select
                  name="tipoDocumento"
                  value={formData.tipoDocumento}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border-2 rounded-md text-gray-800 focus:ring-2 focus:ring-bancamia-rojo transition-all ${fieldErrors.tipoDocumento
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-bancamia-rojo'
                    }`}
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="PA">Pasaporte</option>
                  <option value="PEP">Permiso Especial de Permanencia</option>
                  <option value="PPP">Permiso de Protección Personal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Documento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="numeroDocumento"
                  value={formData.numeroDocumento}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border-2 rounded-md text-gray-800 focus:ring-2 focus:ring-bancamia-rojo transition-all ${fieldErrors.numeroDocumento
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-bancamia-rojo'
                    }`}
                  placeholder="1234567890"
                />
                {fieldErrors.numeroDocumento && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.numeroDocumento}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Nacimiento <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border-2 rounded-md text-gray-800 focus:ring-2 focus:ring-bancamia-rojo transition-all ${fieldErrors.fechaNacimiento
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-bancamia-rojo'
                    }`}
                />
                {fieldErrors.fechaNacimiento && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.fechaNacimiento}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Expedición del Documento <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="fechaExpedicionDocumento"
                  value={formData.fechaExpedicionDocumento}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border-2 rounded-md text-gray-800 focus:ring-2 focus:ring-bancamia-rojo transition-all ${fieldErrors.fechaExpedicionDocumento
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-bancamia-rojo'
                    }`}
                />
                {fieldErrors.fechaExpedicionDocumento && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.fechaExpedicionDocumento}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Información de Negocio */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-bancamia-rojo to-bancamia-rojo-claro text-white font-bold text-lg shadow-lg mr-3">
                2
              </div>
              <h2 className="text-xl font-bold text-[#1E3A5F]">
                Información de Negocio
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad de Negocio <span className="text-red-500">*</span>
                </label>
                <select
                  name="ciudadNegocio"
                  value={formData.ciudadNegocio}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border-2 rounded-md text-gray-800 focus:ring-2 focus:ring-bancamia-rojo transition-all ${fieldErrors.ciudadNegocio
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-bancamia-rojo'
                    }`}
                >
                  <option value="">Seleccione una ciudad...</option>
                  {ciudadesNegocio.map((ciudad) => (
                    <option key={ciudad.codigo} value={ciudad.codigo}>
                      {ciudad.codigo} - {ciudad.nombre}
                    </option>
                  ))}
                </select>
                {fieldErrors.ciudadNegocio && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.ciudadNegocio}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección de Negocio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="direccionNegocio"
                  value={formData.direccionNegocio}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border-2 rounded-md text-gray-800 focus:ring-2 focus:ring-bancamia-rojo transition-all ${fieldErrors.direccionNegocio
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-bancamia-rojo'
                    }`}
                  placeholder="Calle 123 #45-67"
                />
                {fieldErrors.direccionNegocio && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.direccionNegocio}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Celular de Negocio <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="celularNegocio"
                  value={formData.celularNegocio}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border-2 rounded-md text-gray-800 focus:ring-2 focus:ring-bancamia-rojo transition-all ${fieldErrors.celularNegocio
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-bancamia-rojo'
                    }`}
                  placeholder="3001234567"
                />
                {fieldErrors.celularNegocio && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.celularNegocio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Términos y Condiciones / Autorizaciones */}
          <div className="mb-8 pt-6 border-t-2 border-gray-200">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-bancamia-rojo to-bancamia-rojo-claro text-white font-bold text-lg shadow-lg mr-3">
                3
              </div>
              <h2 className="text-xl font-bold text-[#1E3A5F]">
                Autorizaciones y Términos
              </h2>
            </div>

            {/* Autorización Tratamiento de Datos */}
            <div className={`mb-6 p-6 bg-gradient-to-br from-blue-50 to-gray-50 rounded-md border-2 ${fieldErrors.autorizacionTratamientoDatos ? 'border-red-500' : 'border-blue-200'
              }`}>
              <div className="mb-4">
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="autorizacionTratamientoDatos"
                    checked={formData.autorizacionTratamientoDatos}
                    onChange={handleChange}
                    required
                    className="mt-1 h-5 w-5 text-bancamia-rojo focus:ring-bancamia-rojo border-gray-300 rounded transition-all flex-shrink-0"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-[#1E3A5F] group-hover:text-gray-900 transition-colors">
                      Autorización de Tratamiento de Datos Personales <span className="text-red-500">*</span>
                    </span>
                    <div className="mt-2 text-xs text-gray-600 leading-relaxed">
                      {mostrarAutorizacionCompleta ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                          <p className="whitespace-pre-line">{autorizacionTratamientoDatos}</p>
                          <button
                            type="button"
                            onClick={() => setMostrarAutorizacionCompleta(false)}
                            className="text-bancamia-rojo hover:text-bancamia-rojo-oscuro font-semibold"
                          >
                            Ver menos
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="line-clamp-3">
                            {autorizacionTratamientoDatos.substring(0, 200)}...
                          </p>
                          <button
                            type="button"
                            onClick={() => setMostrarAutorizacionCompleta(true)}
                            className="text-bancamia-rojo hover:text-bancamia-rojo-oscuro font-semibold mt-1"
                          >
                            Leer autorización completa
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </label>
                {fieldErrors.autorizacionTratamientoDatos && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.autorizacionTratamientoDatos}
                  </p>
                )}
              </div>
            </div>

            {/* Autorización Contacto */}
            <div className={`mb-6 p-6 bg-gradient-to-br from-blue-50 to-gray-50 rounded-md border-2 ${fieldErrors.autorizacionContacto ? 'border-red-500' : 'border-blue-200'
              }`}>
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="autorizacionContacto"
                  checked={formData.autorizacionContacto}
                  onChange={handleChange}
                  required
                  className="mt-1 h-5 w-5 text-bancamia-rojo focus:ring-bancamia-rojo border-gray-300 rounded transition-all flex-shrink-0"
                />
                <span className="text-sm text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
                  <strong className="text-[#1E3A5F]">{autorizacionContacto}</strong> <span className="text-red-500">*</span>
                </span>
              </label>
              {fieldErrors.autorizacionContacto && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.autorizacionContacto}
                </p>
              )}
            </div>
          </div>

          {/* Botón de Envío */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t-2 border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-bancamia-rojo" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Los campos marcados con <span className="text-red-500">*</span> son obligatorios</span>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative px-10 py-4 bg-gradient-to-r from-bancamia-rojo to-bancamia-rojo-claro hover:from-bancamia-rojo-oscuro hover:to-bancamia-rojo text-white font-bold text-lg rounded-md shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-bancamia-rojo/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="flex items-center space-x-2">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Botón para llenar datos de prueba (desarrollo) */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-center">
            <button
              type="button"
              onClick={llenarDatosPrueba}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-md transition-all duration-200 flex items-center space-x-2 border border-gray-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Llenar con Datos de Prueba</span>
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#1E3A5F] to-[#2D5F8D] text-white mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm">
            <p>© Copyright 2025 – Bancamía. Todos los derechos reservados.</p>
            <p className="mt-2 text-xs text-blue-200">El Banco de los que creen - Transformando realidades</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
