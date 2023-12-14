import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base:"/wnote",
  server: {                // ← ← ← ← ← ←
    host: '127.0.0.1',    // ← 新增内容 ←  169.254.253.34
    port: 4000
  },
  css: {
    preprocessorOptions: {
      scss: {
        // additionalData: `@import "src/assets/markdown.scss";`
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})