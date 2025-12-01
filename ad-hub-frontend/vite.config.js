import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false, // Позволяет использовать другой порт, если указанный занят
    hmr: {
      overlay: true, // Показывать ошибки в браузере
      // clientPort будет автоматически определяться на основе server.port
    },
  },
  // Отключаем кеширование в режиме разработки
  build: {
    rollupOptions: {
      output: {
        // Добавляем хеш к именам файлов для предотвращения кеширования
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
  // Отключаем кеширование для статических ресурсов в dev режиме
  optimizeDeps: {
    force: true, // Принудительно пересобирать зависимости
  },
});