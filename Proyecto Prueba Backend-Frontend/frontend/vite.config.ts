import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url'; // <-- Importante
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

// Recreamos __dirname para ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        // Aquí usamos el __dirname que definimos arriba
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <-- 2. Añade el plugin aquí
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

