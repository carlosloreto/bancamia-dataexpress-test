"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { SolicitudCredito } from "@/lib/types";
import { storageService } from "@/lib/storage";

interface UserInfo {
  email: string;
  userId: string;
  domain: string;
  verified: boolean;
  mode?: string;
}

export default function AdminPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudCredito[]>([]);
  const [filtro, setFiltro] = useState("");
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudCredito | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [, setCargandoUsuario] = useState(true);

  useEffect(() => {
    cargarSolicitudes();
    cargarUsuario();
  }, []);

  const cargarUsuario = async () => {
    try {
      const response = await fetch('/api/user-info');
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
      } else {
        console.warn('No se pudo obtener información del usuario');
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    } finally {
      setCargandoUsuario(false);
    }
  };

  const cargarSolicitudes = () => {
    const datos = storageService.obtenerTodasSolicitudes();
    setSolicitudes(datos);
  };

  const solicitudesFiltradas = solicitudes.filter(
    (s) =>
      s.nombreCompleto.toLowerCase().includes(filtro.toLowerCase()) ||
      s.numeroDocumento.includes(filtro) ||
      s.email.toLowerCase().includes(filtro.toLowerCase()) ||
      (s.id && s.id.toLowerCase().includes(filtro.toLowerCase()))
  );

  const formatearFecha = (fecha: string | undefined) => {
    if (!fecha) return "N/A";
    return new Date(fecha).toLocaleString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatearMonto = (monto: string) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(Number(monto));
  };

  const eliminarSolicitud = (id: string | undefined) => {
    if (!id) return;
    if (confirm("¿Está seguro de eliminar esta solicitud?")) {
      storageService.eliminarSolicitud(id);
      cargarSolicitudes();
      setSolicitudSeleccionada(null);
    }
  };

  const exportarCSV = () => {
    const headers = [
      "ID",
      "Fecha",
      "Nombre",
      "Documento",
      "Email",
      "Teléfono",
      "Monto Solicitado",
      "Plazo",
      "Empresa",
      "Ingresos",
    ];

    const rows = solicitudes.map((s) => [
      s.id || "",
      formatearFecha(s.fechaSolicitud),
      s.nombreCompleto,
      s.numeroDocumento,
      s.email,
      s.telefono,
      s.montoSolicitado,
      s.plazoMeses,
      s.empresa,
      s.ingresosMensuales,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `solicitudes_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4 border-[#FF9B2D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6">
              <Image
                src="/Bancamia2-300x99.png"
                alt="Bancamía"
                width={180}
                height={60}
                className="h-auto w-auto max-h-12"
              />
              <div className="hidden md:block h-12 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-[#1E3A5F]">
                  Panel de Administración
                </h1>
                <p className="text-sm text-gray-600">Gestión de Solicitudes de Crédito</p>
                {userInfo && (
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      ✓ Autenticado con IAP
                    </span>
                    {userInfo.mode === 'development' && (
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                        🔧 Modo Desarrollo
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {userInfo && (
                <div className="hidden lg:flex items-center space-x-3 px-4 py-2 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-[#FF9B2D] rounded-full flex items-center justify-center text-white font-bold">
                    {userInfo.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">{userInfo.email}</p>
                    <p className="text-xs text-gray-500">{userInfo.domain}</p>
                  </div>
                </div>
              )}
              <Link
                href="/"
                className="px-6 py-3 bg-[#1E3A5F] hover:bg-[#2D5F8D] text-white font-semibold rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Volver al Formulario</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#FF9B2D]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Solicitudes</p>
                <p className="text-3xl font-bold text-[#1E3A5F]">{solicitudes.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#FF9B2D]/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Monto Total Solicitado</p>
                <p className="text-2xl font-bold text-[#1E3A5F]">
                  {formatearMonto(
                    solicitudes.reduce((sum, s) => sum + Number(s.montoSolicitado || 0), 0).toString()
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Hoy</p>
                <p className="text-3xl font-bold text-[#1E3A5F]">
                  {
                    solicitudes.filter((s) => {
                      if (!s.fechaSolicitud) return false;
                      const fecha = new Date(s.fechaSolicitud);
                      const hoy = new Date();
                      return fecha.toDateString() === hoy.toDateString();
                    }).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Promedio Solicitado</p>
                <p className="text-2xl font-bold text-[#1E3A5F]">
                  {formatearMonto(
                    solicitudes.length > 0
                      ? (
                          solicitudes.reduce((sum, s) => sum + Number(s.montoSolicitado || 0), 0) /
                          solicitudes.length
                        ).toString()
                      : "0"
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre, documento, email o ID..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#FF9B2D] focus:border-[#FF9B2D] transition-all"
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={exportarCSV}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Exportar CSV</span>
              </button>
              <button
                onClick={cargarSolicitudes}
                className="px-6 py-3 bg-[#FF9B2D] hover:bg-[#E6881A] text-white font-semibold rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Actualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de Solicitudes */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#1E3A5F] to-[#2D5F8D] text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Fecha</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Nombre</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Documento</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Monto</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Plazo</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {solicitudesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center space-y-3">
                        <span className="text-6xl">📭</span>
                        <p className="text-lg font-semibold">No hay solicitudes</p>
                        <p className="text-sm">
                          {filtro
                            ? "No se encontraron resultados para tu búsqueda"
                            : "Las solicitudes aparecerán aquí cuando se envíen"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  solicitudesFiltradas.map((solicitud, index) => (
                    <tr
                      key={solicitud.id || index}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSolicitudSeleccionada(solicitud)}
                    >
                      <td className="px-6 py-4 text-sm font-mono text-[#FF9B2D] font-semibold">
                        {solicitud.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatearFecha(solicitud.fechaSolicitud)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {solicitud.nombreCompleto}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{solicitud.numeroDocumento}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{solicitud.email}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        {formatearMonto(solicitud.montoSolicitado)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{solicitud.plazoMeses} meses</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSolicitudSeleccionada(solicitud);
                            }}
                            className="p-2 text-[#1E3A5F] hover:bg-blue-100 rounded-lg transition-all"
                            title="Ver detalles"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              eliminarSolicitud(solicitud.id);
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                            title="Eliminar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Detalles */}
      {solicitudSeleccionada && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSolicitudSeleccionada(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-[#1E3A5F] to-[#2D5F8D] text-white px-8 py-6 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Detalles de la Solicitud</h2>
                <p className="text-blue-200 text-sm mt-1">{solicitudSeleccionada.id}</p>
              </div>
              <button
                onClick={() => setSolicitudSeleccionada(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Información Personal */}
              <div>
                <h3 className="text-xl font-bold text-[#1E3A5F] mb-4 flex items-center">
                  <span className="w-8 h-8 bg-[#FF9B2D] rounded-full flex items-center justify-center text-white text-sm mr-3">
                    1
                  </span>
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
                  <div>
                    <p className="text-sm text-gray-600">Nombre Completo</p>
                    <p className="font-semibold text-gray-900">{solicitudSeleccionada.nombreCompleto}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Documento</p>
                    <p className="font-semibold text-gray-900">
                      {solicitudSeleccionada.tipoDocumento} {solicitudSeleccionada.numeroDocumento}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Nacimiento</p>
                    <p className="font-semibold text-gray-900">{solicitudSeleccionada.fechaNacimiento}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado Civil</p>
                    <p className="font-semibold text-gray-900">{solicitudSeleccionada.estadoCivil}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{solicitudSeleccionada.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-semibold text-gray-900">{solicitudSeleccionada.telefono}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Dirección</p>
                    <p className="font-semibold text-gray-900">
                      {solicitudSeleccionada.direccion}, {solicitudSeleccionada.ciudad},{" "}
                      {solicitudSeleccionada.departamento}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información Laboral */}
              <div>
                <h3 className="text-xl font-bold text-[#1E3A5F] mb-4 flex items-center">
                  <span className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center text-white text-sm mr-3">
                    2
                  </span>
                  Información Laboral
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
                  <div>
                    <p className="text-sm text-gray-600">Ocupación</p>
                    <p className="font-semibold text-gray-900">{solicitudSeleccionada.ocupacion}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Empresa</p>
                    <p className="font-semibold text-gray-900">{solicitudSeleccionada.empresa}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cargo</p>
                    <p className="font-semibold text-gray-900">{solicitudSeleccionada.cargoActual}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tipo de Contrato</p>
                    <p className="font-semibold text-gray-900">{solicitudSeleccionada.tipoContrato}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ingresos Mensuales</p>
                    <p className="font-semibold text-green-600">
                      {formatearMonto(solicitudSeleccionada.ingresosMensuales)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tiempo en el Empleo</p>
                    <p className="font-semibold text-gray-900">{solicitudSeleccionada.tiempoEmpleo}</p>
                  </div>
                </div>
              </div>

              {/* Información del Crédito */}
              <div>
                <h3 className="text-xl font-bold text-[#1E3A5F] mb-4 flex items-center">
                  <span className="w-8 h-8 bg-[#FF9B2D] rounded-full flex items-center justify-center text-white text-sm mr-3">
                    3
                  </span>
                  Información del Crédito
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
                  <div>
                    <p className="text-sm text-gray-600">Monto Solicitado</p>
                    <p className="font-semibold text-green-600 text-xl">
                      {formatearMonto(solicitudSeleccionada.montoSolicitado)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Plazo</p>
                    <p className="font-semibold text-gray-900">{solicitudSeleccionada.plazoMeses} meses</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Propósito del Crédito</p>
                    <p className="font-semibold text-gray-900">{solicitudSeleccionada.proposito}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">¿Tiene Deudas?</p>
                    <p className="font-semibold text-gray-900">
                      {solicitudSeleccionada.tieneDeudas === "si" ? "Sí" : "No"}
                    </p>
                  </div>
                  {solicitudSeleccionada.tieneDeudas === "si" && solicitudSeleccionada.montoDeudas && (
                    <div>
                      <p className="text-sm text-gray-600">Monto de Deudas</p>
                      <p className="font-semibold text-red-600">
                        {formatearMonto(solicitudSeleccionada.montoDeudas)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Referencias */}
              <div>
                <h3 className="text-xl font-bold text-[#1E3A5F] mb-4 flex items-center">
                  <span className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center text-white text-sm mr-3">
                    4
                  </span>
                  Referencias Personales
                </h3>
                <div className="space-y-4 pl-11">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Referencia #1</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Nombre</p>
                        <p className="font-semibold text-gray-900">{solicitudSeleccionada.refNombre1}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Teléfono</p>
                        <p className="font-semibold text-gray-900">{solicitudSeleccionada.refTelefono1}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Relación</p>
                        <p className="font-semibold text-gray-900">{solicitudSeleccionada.refRelacion1}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Referencia #2</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Nombre</p>
                        <p className="font-semibold text-gray-900">{solicitudSeleccionada.refNombre2}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Teléfono</p>
                        <p className="font-semibold text-gray-900">{solicitudSeleccionada.refTelefono2}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Relación</p>
                        <p className="font-semibold text-gray-900">{solicitudSeleccionada.refRelacion2}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-8 py-6 rounded-b-2xl flex items-center justify-end space-x-4 border-t">
              <button
                onClick={() => eliminarSolicitud(solicitudSeleccionada.id)}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200"
              >
                Eliminar Solicitud
              </button>
              <button
                onClick={() => setSolicitudSeleccionada(null)}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


