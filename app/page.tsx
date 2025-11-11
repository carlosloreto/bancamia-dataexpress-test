"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { initialFormData } from "@/lib/types";
import { enviarSolicitudCredito } from "@/lib/api";

export default function Home() {
  const [formData, setFormData] = useState(initialFormData);
  const [enviado, setEnviado] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solicitudId, setSolicitudId] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Función para llenar el formulario con datos de prueba
  const llenarDatosPrueba = () => {
    // Calcular fecha de nacimiento para que sea mayor de 18 años
    const hoy = new Date();
    const fechaNacimiento = new Date(hoy.getFullYear() - 25, hoy.getMonth(), hoy.getDate());
    const fechaNacimientoStr = fechaNacimiento.toISOString().split('T')[0];

    setFormData({
      // Información Personal
      nombreCompleto: "Juan Pérez García",
      tipoDocumento: "CC",
      numeroDocumento: "1234567890",
      fechaNacimiento: fechaNacimientoStr,
      estadoCivil: "soltero",
      genero: "masculino",
      telefono: "3001234567",
      email: "juan.perez@email.com",
      direccion: "Calle 123 #45-67",
      ciudad: "Bogotá",
      departamento: "Cundinamarca",
      
      // Información Laboral
      ocupacion: "Ingeniero de Software",
      empresa: "Tech Solutions S.A.S",
      cargoActual: "Desarrollador Senior",
      tipoContrato: "indefinido",
      ingresosMensuales: "5000000",
      tiempoEmpleo: "2a5",
      
      // Información del Crédito
      montoSolicitado: "20000000",
      plazoMeses: "36",
      proposito: "Compra de vehículo para uso personal y laboral",
      tieneDeudas: "si",
      montoDeudas: "3000000",
      
      // Referencias
      refNombre1: "María López",
      refTelefono1: "3009876543",
      refRelacion1: "Hermana",
      refNombre2: "Carlos Rodríguez",
      refTelefono2: "3158765432",
      refRelacion2: "Amigo",
    });

    // Limpiar errores y mensajes previos
    setError(null);
    setEnviado(false);
    setSolicitudId(null);

    // Scroll suave al formulario
    setTimeout(() => {
      const formElement = document.querySelector('form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpiar errores previos
    setError(null);
    setSolicitudId(null);
    setIsLoading(true);
    
    try {
      // Enviar solicitud a la API
      const resultado = await enviarSolicitudCredito(formData);
      
      if (resultado.success) {
        // Éxito: mostrar mensaje con ID
        setSolicitudId(resultado.id || null);
        setEnviado(true);
        
        // Resetear el formulario después de 3 segundos
        setTimeout(() => {
          setFormData(initialFormData);
          setEnviado(false);
          setSolicitudId(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 5000);
      } else {
        // Error: mostrar mensajes de error
        const mensajeError = resultado.errors && resultado.errors.length > 0
          ? resultado.errors.map(e => e.message).join('. ')
          : resultado.message;
        
        // Si es timeout, agregar nota especial
        let mensajeFinal = mensajeError;
        if (resultado.message && resultado.message.includes('tardando más')) {
          mensajeFinal = mensajeError + '\n\n⚠️ Nota: La solicitud puede haberse procesado correctamente en el servidor a pesar del timeout. Por favor verifica.';
        }
        
        setError(mensajeFinal);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      setError("Hubo un error inesperado al enviar el formulario. Por favor intenta de nuevo.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bancamía */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
              <div className="flex items-center">
                <Image
                  src="/Bancamia2-300x99.png"
                  alt="Bancamía - El Banco de los que creen"
                  width={220}
                  height={73}
                  priority
                  className="h-auto w-auto max-h-16"
                />
              </div>
              <div className="hidden md:block h-16 w-px bg-gray-300"></div>
              <div className="flex items-center">
        <Image
                  src="/FMF.png"
                  alt="Fundación BBVA Microfinanzas"
                  width={300}
                  height={75}
          priority
                  className="h-auto w-auto max-h-16"
                />
              </div>
            </div>
            <Link
              href="/admin"
              className="px-6 py-3 bg-[#1E3A5F] hover:bg-[#2D5F8D] text-white font-semibold rounded-lg transition-all duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Banner con gradiente azul mejorado */}
      <div className="relative bg-gradient-to-br from-[#1E3A5F] via-[#2D5F8D] to-[#1E3A5F] text-white py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-[#FF9B2D] rounded-full text-sm font-semibold shadow-lg">
              💼 Solicitud de Crédito
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            Tu Crédito Está <span className="text-[#FF9B2D]">a un Paso</span>
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            El Banco de los que creen. Complete el formulario y haga realidad sus proyectos.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mensaje de error */}
        {error && (
          <div className="mb-8 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Error al Enviar la Solicitud</h3>
                <p className="text-red-100">{error}</p>
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

        {/* Mensaje de éxito */}
        {enviado && (
          <div className="mb-8 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">¡Solicitud Enviada Exitosamente!</h3>
                <p className="text-green-100">
                  Tu solicitud ha sido registrada con el ID: <strong className="font-bold">{solicitudId || 'N/A'}</strong>
                </p>
                <p className="text-green-100 mt-2">Pronto nos pondremos en contacto contigo.</p>
              </div>
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-8 md:p-10">
          {/* Botón para llenar datos de prueba */}
          <div className="mb-6 flex justify-end border-b border-gray-200 pb-4">
            <button
              type="button"
              onClick={llenarDatosPrueba}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center space-x-2 border border-blue-200 shadow-sm hover:shadow-md"
              title="Llenar formulario con datos de prueba para testing"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>⚡ Llenar con Datos de Prueba</span>
            </button>
          </div>

          {/* Información Personal */}
          <div className="mb-12">
            <div className="flex items-center mb-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#FF9B2D] to-[#FFB85C] text-white font-bold text-xl shadow-lg mr-4">
                1
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1E3A5F]">
                  Información Personal
                </h2>
                <p className="text-sm text-gray-500">Datos básicos del solicitante</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="nombreCompleto"
                  value={formData.nombreCompleto}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                  placeholder="Juan Pérez García"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento *
                </label>
                <select
                  name="tipoDocumento"
                  value={formData.tipoDocumento}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="PA">Pasaporte</option>
                  <option value="TI">Tarjeta de Identidad</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Documento *
                </label>
                <input
                  type="text"
                  name="numeroDocumento"
                  value={formData.numeroDocumento}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                  placeholder="1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado Civil *
                </label>
                <select
                  name="estadoCivil"
                  value={formData.estadoCivil}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                >
                  <option value="" className="text-gray-500">Seleccione una opción...</option>
                  <option value="soltero">Soltero(a)</option>
                  <option value="casado">Casado(a)</option>
                  <option value="union">Unión Libre</option>
                  <option value="divorciado">Divorciado(a)</option>
                  <option value="viudo">Viudo(a)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Género *
                </label>
                <select
                  name="genero"
                  value={formData.genero}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                >
                  <option value="" className="text-gray-500">Seleccione una opción...</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                  placeholder="3001234567"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección *
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                  placeholder="Calle 123 #45-67"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad *
                </label>
                <input
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                  placeholder="Bogotá"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento *
                </label>
                <input
                  type="text"
                  name="departamento"
                  value={formData.departamento}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                  placeholder="Cundinamarca"
                />
              </div>
            </div>
          </div>

          {/* Información Laboral */}
          <div className="mb-12">
            <div className="flex items-center mb-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#1E3A5F] to-[#2D5F8D] text-white font-bold text-xl shadow-lg mr-4">
                2
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1E3A5F]">
                  Información Laboral
                </h2>
                <p className="text-sm text-gray-500">Detalles de tu actividad económica</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ocupación/Profesión *
                </label>
                <input
                  type="text"
                  name="ocupacion"
                  value={formData.ocupacion}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                  placeholder="Ingeniero de Sistemas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa *
                </label>
                <input
                  type="text"
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                  placeholder="ABC Tech S.A.S."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo Actual *
                </label>
                <input
                  type="text"
                  name="cargoActual"
                  value={formData.cargoActual}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                  placeholder="Desarrollador Senior"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Contrato *
                </label>
                <select
                  name="tipoContrato"
                  value={formData.tipoContrato}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                >
                  <option value="" className="text-gray-500">Seleccione una opción...</option>
                  <option value="indefinido">Término Indefinido</option>
                  <option value="fijo">Término Fijo</option>
                  <option value="prestacion">Prestación de Servicios</option>
                  <option value="independiente">Trabajador Independiente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingresos Mensuales (COP) *
                </label>
                <input
                  type="number"
                  name="ingresosMensuales"
                  value={formData.ingresosMensuales}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                  placeholder="5000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiempo en el Empleo *
                </label>
                <select
                  name="tiempoEmpleo"
                  value={formData.tiempoEmpleo}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                >
                  <option value="" className="text-gray-500">Seleccione una opción...</option>
                  <option value="menos6">Menos de 6 meses</option>
                  <option value="6a12">6 a 12 meses</option>
                  <option value="1a2">1 a 2 años</option>
                  <option value="2a5">2 a 5 años</option>
                  <option value="mas5">Más de 5 años</option>
                </select>
              </div>
            </div>
          </div>

          {/* Información del Crédito */}
          <div className="mb-12">
            <div className="flex items-center mb-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#FF9B2D] to-[#FFB85C] text-white font-bold text-xl shadow-lg mr-4">
                3
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1E3A5F]">
                  Información del Crédito
                </h2>
                <p className="text-sm text-gray-500">Detalles de tu solicitud de crédito</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Solicitado (COP) *
                </label>
                <input
                  type="number"
                  name="montoSolicitado"
                  value={formData.montoSolicitado}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                  placeholder="10000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plazo (Meses) *
                </label>
                <select
                  name="plazoMeses"
                  value={formData.plazoMeses}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                >
                  <option value="" className="text-gray-500">Seleccione una opción...</option>
                  <option value="12">12 meses</option>
                  <option value="24">24 meses</option>
                  <option value="36">36 meses</option>
                  <option value="48">48 meses</option>
                  <option value="60">60 meses</option>
                  <option value="72">72 meses</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Propósito del Crédito *
                </label>
                <textarea
                  name="proposito"
                  value={formData.proposito}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                  placeholder="Describa el propósito del crédito (ej: compra de vivienda, vehículo, educación, etc.)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Tiene Deudas Actualmente? *
                </label>
                <select
                  name="tieneDeudas"
                  value={formData.tieneDeudas}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                >
                  <option value="no">No</option>
                  <option value="si">Sí</option>
                </select>
              </div>

              {formData.tieneDeudas === "si" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto Total de Deudas (COP)
                  </label>
                  <input
                    type="number"
                    name="montoDeudas"
                    value={formData.montoDeudas}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                    placeholder="2000000"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Referencias */}
          <div className="mb-12">
            <div className="flex items-center mb-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#1E3A5F] to-[#2D5F8D] text-white font-bold text-xl shadow-lg mr-4">
                4
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1E3A5F]">
                  Referencias Personales
                </h2>
                <p className="text-sm text-gray-500">Personas que puedan dar referencias sobre ti</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Referencia 1 */}
              <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-[#FF9B2D] transition-all duration-300 shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-[#FF9B2D] rounded-full flex items-center justify-center text-white font-bold mr-3">
                    1
                  </div>
                  <h3 className="text-lg font-bold text-gray-700">Primera Referencia</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="refNombre1"
                      value={formData.refNombre1}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                      placeholder="María González"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="refTelefono1"
                      value={formData.refTelefono1}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                      placeholder="3009876543"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relación *
                    </label>
                    <input
                      type="text"
                      name="refRelacion1"
                      value={formData.refRelacion1}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                      placeholder="Amigo/Familiar"
                    />
                  </div>
                </div>
              </div>

              {/* Referencia 2 */}
              <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-[#FF9B2D] transition-all duration-300 shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-[#1E3A5F] rounded-full flex items-center justify-center text-white font-bold mr-3">
                    2
                  </div>
                  <h3 className="text-lg font-bold text-gray-700">Segunda Referencia</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="refNombre2"
                      value={formData.refNombre2}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                      placeholder="Carlos Ramírez"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="refTelefono2"
                      value={formData.refTelefono2}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                      placeholder="3101234567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relación *
                    </label>
                    <input
                      type="text"
                      name="refRelacion2"
                      value={formData.refRelacion2}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                      placeholder="Amigo/Familiar"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Términos y Condiciones */}
          <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-gray-50 rounded-xl border-2 border-blue-200">
            <label className="flex items-start space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                required
                className="mt-1 h-5 w-5 text-[#FF9B2D] focus:ring-[#FF9B2D] border-gray-300 rounded transition-all"
              />
              <span className="text-sm text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
                <strong className="text-[#1E3A5F]">Acepto los términos y condiciones</strong>, y autorizo el tratamiento de mis datos personales
                de acuerdo con la política de privacidad del banco. *
              </span>
            </label>
          </div>

          {/* Botón de Envío */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t-2 border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-[#FF9B2D]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              <span>Los campos marcados con * son obligatorios</span>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative px-10 py-4 bg-gradient-to-r from-[#FF9B2D] to-[#FFB85C] hover:from-[#E6881A] hover:to-[#FF9B2D] text-white font-bold text-lg rounded-xl shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#FF9B2D]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                    <span>Enviar Solicitud</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </>
                )}
              </span>
            </button>
          </div>
        </form>

        {/* Información de ayuda mejorada */}
        <div className="mt-12 relative overflow-hidden bg-gradient-to-br from-[#1E3A5F] via-[#2D5F8D] to-[#1E3A5F] rounded-2xl shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
          <div className="relative p-8 text-white text-center">
            <div className="inline-block mb-4">
              <div className="w-16 h-16 mx-auto bg-[#FF9B2D] rounded-full flex items-center justify-center text-3xl shadow-lg">
                💬
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-3">¿Necesitas ayuda?</h3>
            <p className="text-lg text-blue-100 mb-6 max-w-2xl mx-auto">
              Nuestro equipo está disponible para asistirte en tu solicitud de crédito
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all">
                <div className="w-10 h-10 bg-[#FF9B2D] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-xs text-blue-200">Línea Nacional</p>
                  <p className="font-bold text-lg">018000126100</p>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all">
                <div className="w-10 h-10 bg-[#FF9B2D] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-xs text-blue-200">WhatsApp</p>
                  <p className="font-bold text-lg">310 860 02 01</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer corporativo */}
      <footer className="bg-gradient-to-r from-[#1E3A5F] to-[#2D5F8D] text-white mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Columna 1 */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-[#FF9B2D]">CONTÁCTANOS</h3>
              <ul className="space-y-2 text-sm">
                <li>Lineamía Nacional: 018000126100</li>
                <li>Lineamía Bogotá: 601 3077021</li>
                <li>Línea WhatsApp: 310 860 02 01</li>
              </ul>
            </div>
            
            {/* Columna 2 */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-[#FF9B2D]">ACCEDE RÁPIDAMENTE</h3>
              <ul className="space-y-2 text-sm">
                <li>Tasas y tarifas</li>
                <li>Preguntas frecuentes</li>
                <li>Protección del Consumidor</li>
                <li>Transparencia</li>
              </ul>
            </div>
            
            {/* Columna 3 */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-[#FF9B2D]">SÍGUENOS</h3>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-xl">f</span>
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-xl">📷</span>
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-xl">▶</span>
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-xl">in</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/20 text-center text-sm">
            <p>© Copyright 2025 – Bancamía. Todos los derechos reservados.</p>
            <p className="mt-2 text-xs text-blue-200">El Banco de los que creen - Transformando realidades</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
