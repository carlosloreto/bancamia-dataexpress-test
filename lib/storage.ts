import { SolicitudCredito } from './types';

// Almacenamiento temporal en localStorage
// Más adelante se puede reemplazar con una conexión a base de datos

const STORAGE_KEY = 'bancamia_solicitudes';

export const storageService = {
  // Guardar una solicitud
  guardarSolicitud: (solicitud: SolicitudCredito): void => {
    try {
      const solicitudes = storageService.obtenerTodasSolicitudes();
      const nuevaSolicitud = {
        ...solicitud,
        id: `SOL-${Date.now()}`,
        fechaSolicitud: new Date().toISOString(),
      };
      solicitudes.push(nuevaSolicitud);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(solicitudes));
      }
    } catch (error) {
      console.error('Error al guardar solicitud:', error);
    }
  },

  // Obtener todas las solicitudes
  obtenerTodasSolicitudes: (): SolicitudCredito[] => {
    try {
      if (typeof window === 'undefined') {
        return [];
      }
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
      return [];
    }
  },

  // Obtener una solicitud por ID
  obtenerSolicitudPorId: (id: string): SolicitudCredito | undefined => {
    const solicitudes = storageService.obtenerTodasSolicitudes();
    return solicitudes.find(s => s.id === id);
  },

  // Eliminar una solicitud
  eliminarSolicitud: (id: string): void => {
    try {
      const solicitudes = storageService.obtenerTodasSolicitudes();
      const filtradas = solicitudes.filter(s => s.id !== id);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtradas));
      }
    } catch (error) {
      console.error('Error al eliminar solicitud:', error);
    }
  },

  // Limpiar todas las solicitudes
  limpiarTodasSolicitudes: (): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error al limpiar solicitudes:', error);
    }
  },
};


