import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Importa o motor diretamente do pacote engine (monorepo).
      '@espacos/engine': path.resolve(__dirname, '../engine/src/index.js'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: { port: 5173 },
});
