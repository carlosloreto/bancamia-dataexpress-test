"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FormularioRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir a la página principal donde está el formulario
    router.replace("/");
  }, [router]);

  // Mostrar un mensaje de carga mientras redirige
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9B2D] mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo al formulario...</p>
      </div>
    </div>
  );
}
