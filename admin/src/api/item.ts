import { ErrorMessageMode } from '#/axios';
import { defHttp } from '@/utils/http';


export class Item {
  /**
   * 物品Id
   */
  id?: number;

  /**
   * 故事Id
   */
  storyId?: string;

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

  constructor(name: string = '') {
    this.key = name;
  }
}

export interface IItemQuery {
  type?: string;
  name?: string;
}

export class ItemApi {
  private storyId: string;
  private type: string;

  constructor(storyId: string, type: string) {
    this.storyId = storyId;
    this.type = type;
  }

  getList(params?: IItemQuery) {
    return defHttp.get<Item[]>({
      url: `/${this.type}/${this.storyId}/items`,
      params
    });
  }

  get(name: string, mode: ErrorMessageMode = 'message') {
    return defHttp.get<Item>({
      url: `/${this.type}/${this.storyId}/item/${name}`,
    }, { errorMessageMode: mode });
  }

  create(item: Item) {
    return defHttp.post<Item>({
      url: `/${this.type}/${this.storyId}/item`,
      data: item,
    });
  }

  update(item: Item) {
    return defHttp.put<Item>({
      url: `/${this.type}/${this.storyId}/item/${item.id}`,
      data: item,
    });
  }

  save(item: Item) {
    if (item.id) {
      return this.update(item);
    }
    return this.create(item);
  }

  remove(id: number) {
    return defHttp.delete({
      url: `/${this.type}/${this.storyId}/item/${id}`,
    });
  }

  getTypes() {
    return defHttp.get<string[]>({
      url: `/${this.type}/${this.storyId}/item/types`,
    });
  }

  getAttrs() {
    return defHttp.get<string[]>({
      url: `/${this.type}/${this.storyId}/item/attrs`,
    });
  }
}