import { LAYOUT } from '@/router/constant';
export default [
  {
    path: '/my',
    component: LAYOUT,
    meta: {
      order: 1,
      icon: 'i-bi:app',
      title: '我的故事',
      hidden: true,
    },
    children: [
      {
        path: '',
        name: 'myStory',
        component: () => import('/@/views/draft/index.vue'),
        meta: {
          title: '故事',
          type: 'draft',
        },
      },
      {
        path: ':story/item',
        name: 'myStoryItem',
        component: () => import('/@/views/item/index.vue'),
        meta: {
          title: '物品',
          type: 'draft',
          hidden: true,
        },
      },
      {
        path: ':story/scene',
        name: 'myStoryScene',
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
