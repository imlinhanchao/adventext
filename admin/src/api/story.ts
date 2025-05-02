import { defHttp } from '@/utils/http';
import { Item } from './item';


export class Inventory extends Item {
  /**
   * 物品数量
   */
  count?: number = 0;
}

export class Story {
  /**
   * 故事Id
   */
  id?: number;

  /**
   * 故事名称
   */
  name: string;

  /**
   * 起始场景
   */
  start: string;

  /**
   * 描述
   */
  description: string;

  /**
   * 人物初始化属性
   */
  attr: Recordable<string|number>;

  /**
   * 属性名称
   */
  attrName: Recordable<string>;

  /**
   * 初始化物品
   */
  inventory: Inventory[];
  
  constructor() {
    this.name = '';
    this.description = '';
    this.start = '';
    this.attr = {};
    this.attrName = {};
    this.inventory = [];
  }
}

export function getStoryList() {
  return defHttp.get<Story[]>({
    url: '/story/list',
  });
}

export function getStory(id: number) {
  return defHttp.get<Story>({
    url: `/story/${id}`,
  });
}

export function createStory(story: Story) {
  return defHttp.post<Story>({
    url: '/story',
    data: story,
  });
}

export function updateStory(story: Story) {
  return defHttp.put<Story>({
    url: `/story/${story.id}`,
    data: story,
  });
}

export function deleteStory(id: number) {
  return defHttp.delete({
    url: `/story/${id}`,
  });
}

