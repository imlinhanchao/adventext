import { LAYOUT } from '@/router/constant';
export default [
  {
    path: '/user',
    component: LAYOUT,
    meta: {
      order: 1,
      icon: 'i-mdi:users',
      title: '用户管理',
      isAdmin: true,
    },
    children: [
      {
        path: '',
        name: 'user',
        component: () => import('/@/views/user/index.vue'),
        meta: {
          title: '用户',
        },
      },
    ],
  },
];
