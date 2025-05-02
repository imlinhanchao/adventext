/**
 * Configure and register global directives
 */
import type { App } from 'vue';
import * as ElIcons from '@element-plus/icons-vue';

export function setupGlobIcon(app: App) {
  for (const icon in ElIcons) {
    app.component(`ElIcon${icon}`, ElIcons[icon]);
  }
}
