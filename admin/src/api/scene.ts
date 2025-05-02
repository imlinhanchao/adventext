import { defHttp } from '@/utils/http';


export class Option {
  text: string;
  append?: string;
  next: string;
  loop?: number;
  value?: string;
  conditions?: Condition[];
  effects?: Effect[];

  constructor(text: string, next: string, conditions?: Condition[], effects?: Effect[]) {
    this.text = text;
    this.next = next;
    this.conditions = conditions;
    this.effects = effects;
  }
}

export class Condition {
  type: string = '';
  name: string = '';
  content: any;
  tip?: string;
}

export class Effect {
  name: string;
  type: string;
  content: string;

  constructor(name: string, type: string, content: string) {
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