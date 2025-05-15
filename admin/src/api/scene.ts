import { defHttp } from '@/utils/http';
import { getStory, updateStory } from './story';
import { getStory as getDraft, updateStory as updateDraft } from './draft';


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
   * 反追加
   */
  antiAppend?: string; 
  /**
   * 下一场景
   */
  next: string;
  /**
   * 下次重复出发秒数
   */
  loop: number;
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

  /**
   * 过滤标志
   */
  disabled?: boolean;

  constructor(text: string, next: string, conditions?: Condition[], effects?: Effect[]) {
    this.text = text;
    this.next = next;
    this.conditions = conditions;
    this.effects = effects;
    this.loop = 0;
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
  /**
   * 条件操作符
   */
  operator?: string = '>';
  /**
   * 是否用于隐藏选项
   */
  isHide: boolean = false;
}

export const EffectType = {
  Item: '获得物品',
  ItemAttr: '物品属性（消耗）',
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
   * 操作符号
   */
  operator: string;
  /**
   * 值
   */
  content: string;

  constructor(name: string = '', type: string = '', content: string = '', operator: string = '=') {
    this.name = name;
    this.type = type;
    this.content = content;
    this.operator = operator;
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
  storyId?: string;

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
   * 结局名称
   */
  theEnd: string = '';

  /**
   * 是否结局
   */
  isEnd: boolean = false;

  /**
   * 面板位置
   */
  position: { x: number, y: number, w?: number, h?: number } = { x: 10, y: 10 };

  constructor(name: string = '') {
    this.name = name;
  }
}

export class SceneApi {
  private storyId: string;
  private type: string;

  constructor(storyId: string, type: string) {
    this.storyId = storyId;
    this.type = type;
  }

  getStory(id: string) {
    if (this.type === 'draft') {
      return getDraft(id);
    }
    return getStory(id);
  }

  updateStory(story: any) {
    if (this.type === 'draft') {
      return updateDraft(story);
    }
    return updateStory(story);
  }

  getList() {
    return defHttp.get<Scene[]>({
      url: `/${this.type}/${this.storyId}/scenes`,
    });
  }

  get(id: number) {
    return defHttp.get<Scene>({
      url: `/${this.type}/${this.storyId}/scene/${id}`,
    });
  }

  create(scene: Scene) {
    return defHttp.post<Scene>({
      url: `/${this.type}/${this.storyId}/scene`,
      data: scene,
    });
  }

  update(scene: Scene) {
    return defHttp.put<Scene>({
      url: `/${this.type}/${this.storyId}/scene/${scene.id}`,
      data: scene,
    });
  }

  save(scene: Scene) {
    if (scene.id) {
      return this.update(scene);
    }
    return this.create(scene);
  }

  delete(id: number) {
    return defHttp.delete({
      url: `/${this.type}/${this.storyId}/scene/${id}`,
    });
  }

  batchSave(scenes: Scene[]) {
    return defHttp.post<Scene[]>({
      url: `/${this.type}/${this.storyId}/scenes`,
      data: scenes,
    });
  }
}