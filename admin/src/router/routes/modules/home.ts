import { LAYOUT } from '@/router/constant';
export default [
  {
    path: '/',
    component: LAYOUT,
    redirect: '/home',
    meta: {
      order: 0,
      icon: 'i-ic:round-home',
      title: '首页',
    },
    children: [
      {
        path: 'home',
        name: 'Home',
        redirect: '/story',
        component: () => import('/@/views/story/index.vue'),
        meta: {
          title: '首页',
        },
      }
    ],
  },
];
