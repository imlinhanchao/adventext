import { LAYOUT } from '@/router/constant';
export default [
  {
    path: '/third',
    component: LAYOUT,
    meta: {
      order: 5,
      icon: 'i-material-symbols:shield',
      title: '第三方登录',
      isAdmin: true,
    },
    children: [
      {
        path: '',
        name: 'third',
        component: () => import('/@/views/third/index.vue'),
        meta: {
          title: '第三方登录',
        },
      },
    ],
  },
];
