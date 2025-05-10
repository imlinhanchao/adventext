import { LAYOUT } from '@/router/constant';
export default [
  {
    path: '/approve',
    component: LAYOUT,
    meta: {
      order: 1,
      icon: 'i-material-symbols:rate-review-rounded',
      title: '待审故事',
      isAdmin: true,
    },
    children: [
      {
        path: '',
        name: 'approveStory',
        component: () => import('/@/views/draft/index.vue'),
        meta: {
          title: '故事',
          type: 'draft',
          query: { status: 1, all: true }
        },
      },
      {
        path: ':story/scene',
        name: 'approveStoryScene',
        component: () => import('/@/views/scene/index.vue'),
        meta: {
          title: '场景',
          type: 'draft',
          hideMenu: true,
          hidden: true,
        },
      },
    ],
  },
];
