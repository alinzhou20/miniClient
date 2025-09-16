import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    cors: true,
    proxy: {
      '/socket.io': {
        // 使用 http 协议作为代理目标，兼容 Engine.IO 轮询与 WebSocket，ws: true 以开启 WS
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'element-plus': ['element-plus'],
          'socket.io': ['socket.io-client'],
          'vue-vendor': ['vue', 'pinia']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['vue', 'pinia', 'element-plus', 'socket.io-client']
  }
})
