import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import electron from 'electron-vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    vue(),
    nodePolyfills(),
    electron({
      main: {
        entry: 'src/main/index.js',  // 指向您的 Electron 主进程入口文件
        vite: {
          build: {
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      },
      preload: {
        input: 'src/preload/index.js'  // 如果有预加载脚本，指向您的预加载脚本
      },
      renderer: {
        input: 'src/renderer/index.js'  // 指向您的渲染器进程入口文件
      }
    })
  ]
});
