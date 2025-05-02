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
      {
        path: ':story/item',
        name: 'StoryItem',
        component: () => import('/@/views/item/index.vue'),
        meta: {
          title: '物品',
          hidden: true,
        },
      },
      {
        path: ':story/scene',
        name: 'StoryScene',
        component: () => import('/@/views/scene/index.vue'),
        meta: {
          title: '场景',
          hidden: true,
        },
      },
    ],
  },
];
