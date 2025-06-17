import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "千屿引擎",
  description: "使用说明文档",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.svg',

    nav: [
      { text: '快速开始', link: '/' },
    ],

    sidebar: [
      {
        text: '简介',
        items: [
          { text: '千屿引擎是什么?', link: '/guide/what-me.md' },
          { text: '快速开始', link: '/guide/getting-started.md' }
        ]
      }
    ],

    socialLinks: [
      { 
        icon: { 
          svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M4 18q-.825 0-1.412-.587T2 16V8q0-.825.588-1.412T4 6h16q.825 0 1.413.588T22 8v8q0 .825-.587 1.413T20 18zm3-5v1q0 .425.288.713T8 15t.713-.288T9 14v-1h1q.425 0 .713-.288T11 12t-.288-.712T10 11H9v-1q0-.425-.288-.712T8 9t-.712.288T7 10v1H6q-.425 0-.712.288T5 12t.288.713T6 13zm7.5 2q.625 0 1.063-.437T16 13.5t-.437-1.062T14.5 12t-1.062.438T13 13.5t.438 1.063T14.5 15m3-3q.625 0 1.063-.437T19 10.5t-.437-1.062T17.5 9t-1.062.438T16 10.5t.438 1.063T17.5 12"/></svg>', 
        },
        ariaLabel: '游玩',
        link: 'https://adventext.fun'
      },
      { icon: 'github', link: 'https://github.com/imlinhanchao/adventext', ariaLabel: 'GitHub' }
    ]
  }
})
