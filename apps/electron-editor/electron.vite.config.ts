import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    optimizeDeps: {
      exclude: ['pixi.js']
    },
    resolve: {
      alias: {
        utils: resolve(__dirname, '../../libs/utils/dist/index.mjs')
      }
    }
  },

  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    server: {
      host: '0.0.0.0'
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    optimizeDeps: {
      include: ['pixi.js', 'three', 'industrial-sdk-core']
    }
  }
})
