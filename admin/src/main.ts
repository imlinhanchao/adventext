import 'virtual:uno.css';
import 'virtual:svg-icons-register';
import '@unocss/reset/tailwind-compat.css';
import 'element-plus/theme-chalk/dark/css-vars.css'
import 'element-plus/dist/index.css';
import '@/assets/style/main.less';
import { createApp } from 'vue';

import App from '@/layouts/App.vue';
import router, { setupRouter } from './router';
import { setupStore } from './store';
import { setupRouterGuard } from './router/guard';
import { setupGlobIcon } from './helper/iconHelper';

async function bootstrap() {
  const app = createApp(App);

  // Configure store
  setupStore(app);

  // Configure routing
  setupRouter(app);

  // router-guard
  setupRouterGuard(router);

  setupGlobIcon(app);

  app.mount('#app');
}

bootstrap();
