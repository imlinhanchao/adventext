import { defHttp } from '@/utils/http';
import { Item } from './item';
import { Effect, IAttribute, Option } from './scene';


export class Inventory extends Item {
  /**
   * 物品数量
   */
  count?: number = 0;
}
export class Draft {
  /**
   * 故事Id
   */
  id?: string;

  /**
   * 故事名称
   */
  name: string;

  /**
   * 别名
   */
  alias: string;

  /**
   * 作者
   */
  author: string;

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
  attr: Recordable<string|number> | IAttribute[];

  /**
   * 属性名称
   */
  attrName: Recordable<string>;

  /**
   * 初始化物品
   */
  inventory: Inventory[];

  /**
   * 全局效果
   */
  effects: Effect[];

  /**
   * 全局选项
   */
  options: Option[];

  /**
   * 自定义样式
   */
  customStyle: string;
  
  /**
   * 故事状态
   */
  status: number;

  /**
   * 审核备注
   */
  comment: string;

  constructor() {
    this.name = '';
    this.alias = '';
    this.author = '';
    this.description = '';
    this.start = '';
    this.attr = [];
    this.attrName = {};
    this.inventory = [];
    this.effects = [];
    this.options = [];
    this.customStyle = '';
    this.status = 0;
    this.comment = '';
  }
}

export function getStoryList(params: any = {}) {
  return defHttp.get<Draft[]>({
    url: '/draft/list',
    params
  });
}

export function getStory(id: string) {
  return defHttp.get<Draft>({
    url: `/draft/${id}`,
  });
}

export function createStory(story: Draft) {
  return defHttp.post<Draft>({
    url: '/draft',
    data: story,
  });
}

export function updateStory(story: Draft) {
  return defHttp.put<Draft>({
    url: `/draft/${story.id}`,
    data: story,
  });
}

export function deleteStory(id: string) {
  return defHttp.delete({
    url: `/draft/${id}`,
  });
}

export function publishStory(id: string) {
  return defHttp.post({
    url: `/draft/${id}/publish`,
  });
}

export function approveStory(id: string, data: { pass: boolean; reason: string }) {
  return defHttp.post({
    url: `/draft/${id}/approve`,
    data
  });
}

export function exportStory(id: string) {
  return defHttp.get({
    url: `/draft/${id}/export`,
  });
}

export function exportStorys(data: string[]) {
  return defHttp.post({
    url: `/draft/export`,
    data
  });
}

export function importStorys(dataZips: string[]) {
  return defHttp.post({
    url: `/draft/import`,
    data: dataZips
  });
}