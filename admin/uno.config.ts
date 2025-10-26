// uno.config.ts
import { defineConfig, presetUno, presetIcons } from 'unocss';

export default defineConfig({
  presets: [presetUno(), presetIcons()],
  theme: {
    colors: {
      primary: 'var(--color-primary)',
    },
  },
  content: {
    filesystem: ["./src/*.{html,js,ts,jsx,tsx,vue,svelte,astro}"],
  },
  shortcuts: [
    ['wh-full', 'w-full h-full'],
    ['flex-middle', 'flex items-center'],
    ['flex-center', 'flex justify-center items-center'],
    ['flex-column', 'flex flex-col'],
  ],
  rules: [
    [/^border-(top|left|right|bottom)-(\d+)$/, ([, p, d]) => ({ [`border-${p}-width`]: `${d}px` })],
  ],
});
