import { defHttp } from '@/utils/http';


export class Item {
  /**
   * 物品Id
   */
  id?: number;

  /**
   * 故事Id
   */
  storyId?: number;

  /**
   * 唯一标识
   */
  key: string = '';

  /**
   * 名称
   */
  name: string = '';

  /**
   * 描述
   */
  description: string = '';

  /**
   * 类型
   */
  type: string = '';

  /**
   * 属性
   */
  attributes: Recordable<string|number> = {};

  /**
   * 属性名称
   */
  attrName: Recordable<string> = {};
}

export interface IItemQuery {
  type?: string;
  name?: string;
}

export function getItemList(storyId: number, params?: IItemQuery) {
  return defHttp.get<Item[]>({
    url: `/story/${storyId}/items`,
    params
  });
}

export function getItem(storyId: number, id: number) {
  return defHttp.get<Item>({
    url: `/story/${storyId}/item/${id}`,
  });
}

export function createItem(storyId: number, item: Item) {
  return defHttp.post<Item>({
    url: `/story/${storyId}/item`,
    data: item,
  });
}

export function updateItem(storyId: number, item: Item) {
  return defHttp.put<Item>({
    url: `/story/${storyId}/item/${item.id}`,
    data: item,
  });
}

export function deleteItem(storyId: number, id: number) {
  return defHttp.delete({
    url: `/story/${storyId}/item/${id}`,
  });
}
