import { LAYOUT } from '@/router/constant';
export default [
  {
    path: '/story',
    component: LAYOUT,
    meta: {
      order: 1,
      icon: 'i-bi:app',
      title: '故事',
    },
    children: [
      {
        path: '',
        name: 'story',
        component: () => import('/@/views/story/index.vue'),
        meta: {
          title: '故事',
        },
      },
    ],
  },
];
