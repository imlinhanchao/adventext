import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { ConfigEnv, UserConfig } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import { OUTPUT_DIR } from './build/constant';
import { wrapperEnv } from './build/utils';
import { createVitePlugins } from './build/vite/plugin';

function pathResolve(dir) {
  return resolve(process.cwd(), '.', dir);
}

function getWebPort() {
  const filePath = pathResolve('src/config.json');
  if (existsSync(filePath)) {
    return JSON.parse(readFileSync(filePath, 'utf-8')).webport || 3000;
  } else {
    return 3000; // Default port if config file does not exist
  }
}

export default defineConfig(({ command, mode }: ConfigEnv): UserConfig => {
  const root = process.cwd();

  const env = loadEnv(mode, root);

  // The boolean type read by loadEnv is a string. This function can be converted to boolean type
  const viteEnv = wrapperEnv(env);

  const { VITE_PORT, VITE_PUBLIC_PATH, VITE_DROP_CONSOLE } = viteEnv;

  const isBuild = command === 'build';

  return {
    root,
    base: VITE_PUBLIC_PATH,
    resolve: {
      // 忽略后缀名的配置选项, 添加 .vue 选项时要记得原本默认忽略的选项也要手动写入
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.vue', '.json', '.less', '.css', '.mjs'],
      // 添加别名
      alias: [
        {
          find: 'vue-i18n',
          replacement: 'vue-i18n/dist/vue-i18n.cjs.js',
        },
        // @/xxxx => src/xxxx
        {
          find: /@\//,
          replacement: pathResolve('src') + '/',
        },
        // #/xxxx => types/xxxx
        {
          find: /#\//,
          replacement: pathResolve('types') + '/',
        },
      ],
    },
    server: {
      // Listening on all local IPs
      host: true,
      port: VITE_PORT,
      strictPort: false,
      open: false,
      cors: true,
      hmr: true,
      // Load proxy configuration from .env
      proxy: {
        "/api": {
          target: `http://127.0.0.1:${getWebPort()}/api`,
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/api`), ''),
        }
      }
    },
    esbuild: {
      drop: VITE_DROP_CONSOLE ? ['console', 'debugger'] : [],
    },
    build: {
      target: 'es2015',
      outDir: OUTPUT_DIR,
      chunkSizeWarningLimit: 2000,
    },
    define: {
      // Suppress warning
      __INTLIFY_PROD_DEVTOOLS__: false,
    },

    css: {
      modules: {
        localsConvention: 'camelCaseOnly'
      },
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
        },
      },
    },

    // The vite plugin used by the project. The quantity is large, so it is separately extracted and managed
    plugins: createVitePlugins(viteEnv, isBuild),
    optimizeDeps: {
      include: ['vue', 'vue-router', 'vue-types', '@vueuse/core', 'axios', 'echarts', 'element-resize-detector'],
    },
  };
});
