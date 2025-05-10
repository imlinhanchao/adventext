import { LAYOUT } from '@/router/constant';
export default [
  {
    path: '/manage',
    component: LAYOUT,
    meta: {
      order: 1,
      icon: 'i-ph:sword',
      title: '故事管理',
    },
    children: [
      {
        path: '',
        name: 'manageStory',
        component: () => import('/@/views/draft/index.vue'),
        meta: {
          title: '故事',
          type: 'draft',
        },
      },
      {
        path: ':story/item',
        name: 'manageStoryItem',
        component: () => import('/@/views/item/index.vue'),
        meta: {
          title: '物品',
          type: 'draft',
          hidden: true,
        },
      },
      {
        path: ':story/scene',
        name: 'manageStoryScene',
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
