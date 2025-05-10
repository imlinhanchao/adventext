import { LAYOUT } from '@/router/constant';

export default [
  {
    path: '/story',
    component: LAYOUT,
    meta: {
      order: 1,
      icon: 'i-bi:app',
      title: '投稿故事',
      isAdmin: true,
    },
    children: [
      {
        path: '',
        name: 'story',
        component: () => import('/@/views/story/index.vue'),
        meta: {
          title: '故事',
          type: 'story',
        },
      },
      {
        path: ':story/item',
        name: 'StoryItem',
        component: () => import('/@/views/item/index.vue'),
        meta: {
          title: '物品',
          type: 'story',
          hidden: true,
        },
      },
      {
        path: ':story/scene',
        name: 'StoryScene',
        component: () => import('/@/views/scene/index.vue'),
        meta: {
          title: '场景',
          type: 'story',
          hideMenu: true,
          hidden: true,
        },
      },
    ],
  },
];
