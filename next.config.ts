import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Configuración para silenciar el warning del workspace root
  // Configuramos el root explícitamente para evitar conflictos con lockfiles en directorios padre
  turbopack: {
    root: path.resolve(__dirname),
  } as any,
};

export default nextConfig;
