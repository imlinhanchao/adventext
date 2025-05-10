import { defHttp } from '@/utils/http';
import { Scene } from './scene';
import { Inventory } from './draft';

export class Profile {

  /**
   * 用户ID
   */
  userId: number;

  /**
   * 故事 ID
   */
  storyId: string;

  /**
   * 当前场景
   */
  scene: string;

  /**
   * 来源场景
   */
  from: string;

  /**
   * 物品栏
   */
  inventory: Inventory[];

  /**
   * 属性
   */
  attr: any;

  /**
   * 属性名称
   */
  attrName: { [key: string]: [string, string] | string } = {}

  constructor(user: number, storyId: string) {
    this.userId = user;
    this.storyId = storyId;
    this.scene = '';
    this.from = '';
    this.inventory = [];
    this.attr = {};
    this.attrName = {};
  }
}

export class SceneRecord {
  /**
   * 场景
   */
  scene: string = '';

  /**
   * 来源场景
   */
  from: string = '';

  /**
   * 内容
   */
  content: string = '';

  /**
   * 选项
   */
  option: string = '';

  /**
   * 时间
   */
  time: number = Date.now();

  constructor(scene: Scene, option: string, from: string) {
    this.scene = scene.name;
    this.from = from;
    this.content = scene.content;
    this.option = option;
    this.time = Date.now();
  }
}

/**
 * 模拟运行游戏
 */
export function gameRun(data: { scene: Scene, profile: Profile, option: string, timezone?: number, value: string }) {
  return defHttp.post({
    url: `/story/run`,
    data
  }, {
    errorMessageMode: 'none',
  });
}

export function updateOptions(scene: Scene, profile: Profile, records: SceneRecord[]) {
  return defHttp.post({
    url: `/story/filter`,
    data: { scene, profile, records, timezone: new Date().getTimezoneOffset() / -60 } 
  }, {
    errorMessageMode: 'none',
  });
}
