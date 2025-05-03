import { defHttp } from '@/utils/http';


export class Option {
  /**
   * 选项文本
   */
  text: string;
  /**
   * 追加内容
   */
  append?: string;
  /**
   * 下一场景
   */
  next: string;
  /**
   * 下次重复出发秒数
   */
  loop?: number;
  /**
   * 客户端输入提示文本
   */
  value?: string;
  /**
   * 条件列表
   */
  conditions?: Condition[];
  /**
   * 效果列表
   */
  effects?: Effect[];

  constructor(text: string, next: string, conditions?: Condition[], effects?: Effect[]) {
    this.text = text;
    this.next = next;
    this.conditions = conditions;
    this.effects = effects;
  }
}

export const ConditionType = {
  Time: '时间',
  Item: '物品',
  ItemType: '物品类型',
  ItemAttr: '物品属性',
  Attr: '属性',
  Value: '输入值',
  Fn: '函数判定',
};

export class Condition {
  /**
   * 条件类型，Time：时间，Item:物品，ItemType：物品类型，ItemAttr:物品属性,Attr:属性,Value:输入值，Fn:函数判定
   */
  type: string = '';
  /**
   * 条件物品名，类型为 Item 时选择
   */
  name: string = '';
  /**
   * 条件内容
   */
  content: any;
  /**
   * 条件失败时的提示
   */
  tip?: string;
}

export const EffectType = {
  Item: '获得物品',
  Attr: '属性变化',
  Fn: '函数调用',
}

export class Effect {
  /**
   * 效果对象
   */
  name: string;
  /**
   * 类型,Item: 获得物品，Attr: 属性变化，Fn: 函数调用
   */
  type: string;
  /**
   * 值
   */
  content: string;

  constructor(name: string = '', type: string = '', content: string = '') {
    this.name = name;
    this.type = type;
    this.content = content;
  }
}

export class Scene {
  /**
   * 场景Id
   */
  id?: number;

  /**
   * 故事Id
   */
  storyId?: number;

  /**
   * 场景名称
   */
  name: string = '';

  /**
   * 场景内容
   */
  content: string = '';

  /**
   * 场景选项
   */
  options: Option[] = [];

  /**
   * 面板位置
   */
  position: { x: number, y: number, w?: number, h?: number } = { x: 0, y: 0 };
}

export function getSceneList(storyId: number) {
  return defHttp.get<Scene[]>({
    url: `/story/${storyId}/scenes`,
  });
}

export function getScene(storyId: number, id: number) {
  return defHttp.get<Scene>({
    url: `/story/${storyId}/scene/${id}`,
  });
}

export function createScene(storyId: number, scene: Scene) {
  return defHttp.post<Scene>({
    url: `/story/${storyId}/scene`,
    data: scene,
  });
}

export function updateScene(storyId: number, scene: Scene) {
  return defHttp.put<Scene>({
    url: `/story/${storyId}/scene/${scene.id}`,
    data: scene,
  });
}

export function deleteScene(storyId: number, id: number) {
  return defHttp.delete({
    url: `/story/${storyId}/scene/${id}`,
  });
}

export function sceneBatchSave(storyId: number, scenes: Scene[]) {
  return defHttp.post<Scene[]>({
    url: `/story/${storyId}/scenes`,
    data: scenes,
  });
}