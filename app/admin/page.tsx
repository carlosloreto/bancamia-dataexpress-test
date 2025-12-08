"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SolicitudCredito, AutorizacionDatos } from "@/lib/types";
import { storageService } from "@/lib/storage";
import { ciudadesNegocio } from "@/lib/ciudades-negocio";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { auth } from "@/lib/firebase";

function AdminContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [solicitudes, setSolicitudes] = useState<(SolicitudCredito | AutorizacionDatos)[]>([]);
  const [filtro, setFiltro] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<(SolicitudCredito | AutorizacionDatos) | null>(null);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);
  
  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [elementosPorPagina, setElementosPorPagina] = useState(10);

  useEffect(() => {
    // Cargar solicitudes al montar el componente
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    setCargandoSolicitudes(true);
    try {
      // Obtener idToken de Firebase para incluir en el header
      const user = auth.currentUser;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (user) {
        try {
          const idToken = await user.getIdToken();
          headers['Authorization'] = `Bearer ${idToken}`;
        } catch (tokenError) {
          console.error('Error al obtener token:', tokenError);
        }
      }
      
      const response = await fetch('/api/solicitudes', {
        headers: headers as HeadersInit,
      });
      
      if (response.ok) {
        const data = await response.json();
        // La API puede devolver los datos en diferentes formatos
        // Intentar extraer el array de solicitudes
        let solicitudesData: (SolicitudCredito | AutorizacionDatos)[] = [];
        
        if (data.data && Array.isArray(data.data)) {
          solicitudesData = data.data;
        } else if (data.solicitudes && Array.isArray(data.solicitudes)) {
          solicitudesData = data.solicitudes;
        } else if (Array.isArray(data)) {
          solicitudesData = data;
        }
        
        setSolicitudes(solicitudesData);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error obteniendo solicitudes:', response.status, response.statusText);
        console.error('Detalles del error:', errorData);
        
        // Verificar si es un error de índice de Firestore
        if (errorData.error?.details?.originalError?.includes('requires an index')) {
          console.error('⚠️ ERROR: Firestore requiere un índice compuesto.');
          console.error('📋 Solución: Haz clic en el enlace del error para crear el índice automáticamente.');
          console.error('🔗 Enlace:', errorData.error?.details?.originalError?.match(/https:\/\/[^\s]+/)?.[0]);
        }
        
        // En caso de error, intentar cargar desde localStorage como fallback
        const datos = storageService.obtenerTodasSolicitudes();
        setSolicitudes(datos);
      }
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
      // En caso de error, intentar cargar desde localStorage como fallback
      const datos = storageService.obtenerTodasSolicitudes();
      setSolicitudes(datos);
    } finally {
      setCargandoSolicitudes(false);
    }
  };

  // Función helper para normalizar fechas a solo fecha (sin hora) en hora local
  const normalizarFecha = (fecha: string | Date | undefined): Date | null => {
    if (!fecha) return null;
    const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
    if (isNaN(fechaObj.getTime())) return null;
    // Crear nueva fecha solo con año, mes y día en hora local
    return new Date(fechaObj.getFullYear(), fechaObj.getMonth(), fechaObj.getDate());
  };

  const solicitudesFiltradas = solicitudes.filter((s) => {
    // Filtro por texto (nombre, documento, email)
    const filtroTexto = filtro.toLowerCase();
    const coincideTexto = !filtro || 
      (s.nombreCompleto && s.nombreCompleto.toLowerCase().includes(filtroTexto)) ||
      (s.numeroDocumento && s.numeroDocumento.includes(filtro)) ||
      (s.email && s.email.toLowerCase().includes(filtroTexto));
    
    // Filtro por fecha desde
    let coincideFechaDesde = true;
    if (fechaDesde && s.fechaSolicitud) {
      const fechaSolicitud = normalizarFecha(s.fechaSolicitud);
      const desde = normalizarFecha(fechaDesde);
      if (fechaSolicitud && desde) {
        coincideFechaDesde = fechaSolicitud >= desde;
      } else {
        coincideFechaDesde = false;
      }
    }
    
    // Filtro por fecha hasta
    let coincideFechaHasta = true;
    if (fechaHasta && s.fechaSolicitud) {
      const fechaSolicitud = normalizarFecha(s.fechaSolicitud);
      const hasta = normalizarFecha(fechaHasta);
      if (fechaSolicitud && hasta) {
        coincideFechaHasta = fechaSolicitud <= hasta;
      } else {
        coincideFechaHasta = false;
      }
    }
    
    return coincideTexto && coincideFechaDesde && coincideFechaHasta;
  });

  // Cálculos de paginación
  const totalPaginas = Math.ceil(solicitudesFiltradas.length / elementosPorPagina);
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const indiceFin = indiceInicio + elementosPorPagina;
  const solicitudesPaginadas = solicitudesFiltradas.slice(indiceInicio, indiceFin);
  
  // Resetear a página 1 cuando cambian los filtros o elementos por página
  useEffect(() => {
    setPaginaActual(1);
  }, [filtro, fechaDesde, fechaHasta, elementosPorPagina]);

  // Funciones de navegación
  const irAPagina = (pagina: number) => {
    if (pagina >= 1 && pagina <= totalPaginas) {
      setPaginaActual(pagina);
    }
  };

  const irAPrimeraPagina = () => irAPagina(1);
  const irAUltimaPagina = () => irAPagina(totalPaginas);
  const irAPaginaAnterior = () => irAPagina(paginaActual - 1);
  const irAPaginaSiguiente = () => irAPagina(paginaActual + 1);

  // Generar números de página para mostrar
  const generarNumerosPagina = () => {
    const paginas: (number | string)[] = [];
    const maxPaginasVisibles = 5;
    
    if (totalPaginas <= maxPaginasVisibles) {
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      if (paginaActual <= 3) {
        for (let i = 1; i <= 4; i++) paginas.push(i);
        paginas.push('...');
        paginas.push(totalPaginas);
      } else if (paginaActual >= totalPaginas - 2) {
        paginas.push(1);
        paginas.push('...');
        for (let i = totalPaginas - 3; i <= totalPaginas; i++) paginas.push(i);
      } else {
        paginas.push(1);
        paginas.push('...');
        for (let i = paginaActual - 1; i <= paginaActual + 1; i++) paginas.push(i);
        paginas.push('...');
        paginas.push(totalPaginas);
      }
    }
    
    return paginas;
  };

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

  const formatearMonto = (monto: string | number | undefined) => {
    if (!monto) return "N/A";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(Number(monto));
  };

  // Función helper para obtener el teléfono (puede ser telefono o celularNegocio)
  const obtenerTelefono = (s: SolicitudCredito | AutorizacionDatos): string => {
    if ('telefono' in s && s.telefono) return s.telefono;
    if ('celularNegocio' in s && s.celularNegocio) return s.celularNegocio;
    return "N/A";
  };

  // Función helper para verificar si es AutorizacionDatos
  const esAutorizacionDatos = (s: SolicitudCredito | AutorizacionDatos): s is AutorizacionDatos => {
    return 'ciudadNegocio' in s && 'direccionNegocio' in s && 'celularNegocio' in s;
  };

  // Función helper para obtener el nombre de la ciudad de negocio
  const obtenerNombreCiudad = (codigo: string | undefined): string => {
    if (!codigo) return "N/A";
    const ciudad = ciudadesNegocio.find(c => c.codigo === codigo);
    return ciudad ? ciudad.nombre : codigo;
  };

  // Función helper para obtener la URL del documento PDF
  const obtenerUrlDocumento = (s: SolicitudCredito | AutorizacionDatos): string | null => {
    // Verificar si tiene el campo documento con url
    if ('documento' in s && s.documento && typeof s.documento === 'object') {
      const doc = s.documento as any;
      if (doc.url && typeof doc.url === 'string') {
        return doc.url;
      }
    }
    return null;
  };

  // Función para manejar el clic en el botón de ver (ojo)
  const handleVerSolicitud = (e: React.MouseEvent, solicitud: SolicitudCredito | AutorizacionDatos) => {
    e.stopPropagation();
    const urlDocumento = obtenerUrlDocumento(solicitud);
    
    if (urlDocumento) {
      // Si hay URL del documento, abrir en nueva ventana
      window.open(urlDocumento, '_blank', 'noopener,noreferrer');
    } else {
      // Si no hay documento, mostrar modal con detalles
      setSolicitudSeleccionada(solicitud);
    }
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
      "Tipo Documento",
      "Numero Documento",
      "Fecha Nacimiento",
      "Email",
      "Ciudad Negocio",
      "Direccion Negocio",
      "Celular Negocio",
      "Autorizacion Datos",
      "Autorizacion Contacto",
    ];

    const rows = solicitudes.map((s) => [
      s.id || "",
      formatearFecha(s.fechaSolicitud),
      s.nombreCompleto,
      s.tipoDocumento,
      s.numeroDocumento,
      s.fechaNacimiento || "N/A",
      s.email,
      'ciudadNegocio' in s ? obtenerNombreCiudad(s.ciudadNegocio) : 'N/A',
      'direccionNegocio' in s ? (s.direccionNegocio || 'N/A') : 'N/A',
      'celularNegocio' in s ? (s.celularNegocio || 'N/A') : 'N/A',
      'autorizacionTratamientoDatos' in s ? (s.autorizacionTratamientoDatos ? 'Sí' : 'No') : 'N/A',
      'autorizacionContacto' in s ? (s.autorizacionContacto ? 'Sí' : 'No') : 'N/A',
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `autorizaciones_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const handleLogout = async () => {
    if (confirm("¿Está seguro que desea cerrar sesión?")) {
      try {
        await logout();
        router.push("/login");
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4 border-bancamia-rojo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6">
              <Image
                src="/Bancamia2-300x99.png"
                alt="Bancamía"
                width={220}
                height={73}
                className="h-auto w-auto max-h-16"
              />
              <div className="hidden md:block h-16 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-bancamia-azul">
                  Panel de Administración
                </h1>
                <p className="text-sm text-gray-600">Gestión de Solicitudes de Crédito</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="hidden lg:flex items-center space-x-3 px-4 py-2 bg-red-50 rounded-lg">
                  <div className="w-10 h-10 bg-bancamia-rojo rounded-full flex items-center justify-center text-white font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">{user.email}</p>
                    {user.name && <p className="text-xs text-gray-500">{user.name}</p>}
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Cerrar Sesión"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controles - Todo en una línea */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Búsqueda por texto */}
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Buscar..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-bancamia-rojo focus:border-bancamia-rojo transition-all"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Fecha desde */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 hidden sm:inline">Desde</span>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-bancamia-rojo focus:border-bancamia-rojo transition-all"
              />
            </div>
            
            {/* Fecha hasta */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 hidden sm:inline">Hasta</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-bancamia-rojo focus:border-bancamia-rojo transition-all"
              />
            </div>

            {/* Separador */}
            <div className="hidden lg:block h-8 w-px bg-gray-200"></div>
            
            {/* Resumen */}
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span className="font-semibold text-bancamia-azul">{solicitudesFiltradas.length}</span>
              <span>/</span>
              <span>{solicitudes.length}</span>
            </div>

            {/* Limpiar filtros */}
            {(filtro || fechaDesde || fechaHasta) && (
              <button
                onClick={() => {
                  setFiltro("");
                  setFechaDesde("");
                  setFechaHasta("");
                }}
                className="p-2 text-gray-400 hover:text-bancamia-rojo hover:bg-red-50 rounded-lg transition-all"
                title="Limpiar filtros"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Separador */}
            <div className="hidden lg:block h-8 w-px bg-gray-200"></div>
            
            {/* Botones de acción - Solo iconos */}
            <div className="flex items-center gap-2">
              <button
                onClick={exportarCSV}
                className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-all"
                title="Exportar CSV"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button
                onClick={cargarSolicitudes}
                disabled={cargandoSolicitudes}
                className="p-2 bg-red-50 text-bancamia-rojo hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-all"
                title="Actualizar"
              >
                {cargandoSolicitudes ? (
                  <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de Solicitudes */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-bancamia-rojo to-bancamia-rojo-claro text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Fecha</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Nombre</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Documento</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Ciudad Negocio</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Celular</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cargandoSolicitudes ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <svg className="animate-spin h-8 w-8 text-bancamia-rojo" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-lg font-semibold text-gray-600">Cargando solicitudes...</p>
                      </div>
                    </td>
                  </tr>
                ) : solicitudesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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
                  solicitudesPaginadas.map((solicitud, index) => (
                    <tr
                      key={solicitud.id || index}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSolicitudSeleccionada(solicitud)}
                    >
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatearFecha(solicitud.fechaSolicitud)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {solicitud.nombreCompleto}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{solicitud.numeroDocumento}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {'ciudadNegocio' in solicitud ? obtenerNombreCiudad(solicitud.ciudadNegocio) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {obtenerTelefono(solicitud)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={(e) => handleVerSolicitud(e, solicitud)}
                            className="p-2 text-bancamia-azul hover:bg-bancamia-rojo/10 rounded-lg transition-all"
                            title={obtenerUrlDocumento(solicitud) ? "Ver PDF" : "Ver detalles"}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 3v5a1 1 0 001 1h5"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 13h6M9 17h4"
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
          
          {/* Controles de Paginación */}
          {solicitudesFiltradas.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Info y selector de elementos por página */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  Mostrando <span className="font-semibold text-gray-900">{indiceInicio + 1}-{Math.min(indiceFin, solicitudesFiltradas.length)}</span> de <span className="font-semibold text-gray-900">{solicitudesFiltradas.length}</span>
                </span>
                <div className="flex items-center gap-2">
                  <label htmlFor="elementosPorPagina" className="text-gray-500">Por página:</label>
                  <select
                    id="elementosPorPagina"
                    value={elementosPorPagina}
                    onChange={(e) => setElementosPorPagina(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-bancamia-rojo focus:border-bancamia-rojo"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              
              {/* Navegación de páginas */}
              <div className="flex items-center gap-1">
                <button onClick={irAPrimeraPagina} disabled={paginaActual === 1} className="p-2 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" title="Primera página">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                </button>
                <button onClick={irAPaginaAnterior} disabled={paginaActual === 1} className="p-2 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" title="Anterior">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex items-center gap-1 mx-2">
                  {generarNumerosPagina().map((pagina, index) => (
                    pagina === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-400">...</span>
                    ) : (
                      <button key={pagina} onClick={() => irAPagina(pagina as number)} className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors ${paginaActual === pagina ? 'bg-bancamia-rojo text-white' : 'text-gray-600 hover:bg-gray-200'}`}>{pagina}</button>
                    )
                  ))}
                </div>
                <button onClick={irAPaginaSiguiente} disabled={paginaActual === totalPaginas || totalPaginas === 0} className="p-2 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" title="Siguiente">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <button onClick={irAUltimaPagina} disabled={paginaActual === totalPaginas || totalPaginas === 0} className="p-2 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" title="Última página">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}
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
            <div className="sticky top-0 bg-gradient-to-r from-bancamia-rojo to-bancamia-rojo-claro text-white px-8 py-6 rounded-t-2xl flex items-center justify-between">
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
                <h3 className="text-xl font-bold text-bancamia-azul mb-4 flex items-center">
                  <span className="w-8 h-8 bg-bancamia-rojo rounded-full flex items-center justify-center text-white text-sm mr-3">
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
                  {esAutorizacionDatos(solicitudSeleccionada) ? (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Fecha de Expedición del Documento</p>
                        <p className="font-semibold text-gray-900">{solicitudSeleccionada.fechaExpedicionDocumento}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold text-gray-900">{solicitudSeleccionada.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Celular de Negocio</p>
                        <p className="font-semibold text-gray-900">{solicitudSeleccionada.celularNegocio}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Ciudad de Negocio</p>
                        <p className="font-semibold text-gray-900">{solicitudSeleccionada.ciudadNegocio}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Dirección de Negocio</p>
                        <p className="font-semibold text-gray-900">{solicitudSeleccionada.direccionNegocio}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Autorización Tratamiento de Datos</p>
                        <p className="font-semibold text-gray-900">
                          {solicitudSeleccionada.autorizacionTratamientoDatos ? "Sí" : "No"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Autorización Contacto</p>
                        <p className="font-semibold text-gray-900">
                          {solicitudSeleccionada.autorizacionContacto ? "Sí" : "No"}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Estado Civil</p>
                        <p className="font-semibold text-gray-900">
                          {'estadoCivil' in solicitudSeleccionada ? solicitudSeleccionada.estadoCivil : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Género</p>
                        <p className="font-semibold text-gray-900">
                          {'genero' in solicitudSeleccionada ? solicitudSeleccionada.genero : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold text-gray-900">{solicitudSeleccionada.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Teléfono</p>
                        <p className="font-semibold text-gray-900">{obtenerTelefono(solicitudSeleccionada)}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Dirección</p>
                        <p className="font-semibold text-gray-900">
                          {'direccion' in solicitudSeleccionada && 'ciudad' in solicitudSeleccionada && 'departamento' in solicitudSeleccionada
                            ? `${solicitudSeleccionada.direccion}, ${solicitudSeleccionada.ciudad}, ${solicitudSeleccionada.departamento}`
                            : 'N/A'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Información Laboral - Solo para SolicitudCredito */}
              {!esAutorizacionDatos(solicitudSeleccionada) && 'ocupacion' in solicitudSeleccionada && (
                <div>
                  <h3 className="text-xl font-bold text-bancamia-azul mb-4 flex items-center">
                    <span className="w-8 h-8 bg-bancamia-azul rounded-full flex items-center justify-center text-white text-sm mr-3">
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
              )}

              {/* Información del Crédito - Solo para SolicitudCredito */}
              {!esAutorizacionDatos(solicitudSeleccionada) && 'montoSolicitado' in solicitudSeleccionada && (
                <div>
                  <h3 className="text-xl font-bold text-bancamia-azul mb-4 flex items-center">
                    <span className="w-8 h-8 bg-bancamia-rojo rounded-full flex items-center justify-center text-white text-sm mr-3">
                      {esAutorizacionDatos(solicitudSeleccionada) ? '2' : '3'}
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
              )}

              {/* Referencias - Solo para SolicitudCredito */}
              {!esAutorizacionDatos(solicitudSeleccionada) && 'refNombre1' in solicitudSeleccionada && (
                <div>
                  <h3 className="text-xl font-bold text-bancamia-azul mb-4 flex items-center">
                    <span className="w-8 h-8 bg-bancamia-azul rounded-full flex items-center justify-center text-white text-sm mr-3">
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
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-8 py-6 rounded-b-2xl flex items-center justify-between border-t">
              <div>
                {obtenerUrlDocumento(solicitudSeleccionada) && (
                  <button
                    onClick={() => {
                      const url = obtenerUrlDocumento(solicitudSeleccionada);
                      if (url) {
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="px-6 py-3 bg-bancamia-azul hover:bg-bancamia-rojo text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver PDF
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-4">
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
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminContent />
    </ProtectedRoute>
  );
}

