import { ErrorMessageMode } from '#/axios';
import { defHttp } from '@/utils/http';
import { Condition } from './scene';

export interface Achievement {
  /**
   * 用户id
   */
  user: number;
  /**
   * 来自的Profile
   */
  fromProfile: number;
  /**
   * 成就id
   */
  targetId: number;
  /**
   * 故事id
   */
  storyId: string;
  /**
   * 成就的key
   */
  key: string;
  /**
   * 成就名称
   */
  name: string;
  /**
   * 成就描述
   */
  description: string;
  /**
   * 来自场景
   */
  from: string;
  /**
   * 颁发时间
   */
  time: number;
}
export class Target {
  /**
   * 成就Id
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
   * 条件列表
   */
  conditions: Condition[] = [];

  constructor(name: string = '') {
    this.key = name;
  }
}

export interface ITargetQuery {
  key?: string;
  name?: string;
}

export class TargetApi {
  private storyId: string;
  private type: string;

  constructor(storyId: string, type: string) {
    this.storyId = storyId;
    this.type = type;
  }

  getList(params?: ITargetQuery) {
    return defHttp.get<Target[]>({
      url: `/${this.type}/${this.storyId}/targets`,
      params
    });
  }

  get(name: string, mode: ErrorMessageMode = 'message') {
    return defHttp.get<Target>({
      url: `/${this.type}/${this.storyId}/target/${name}`,
    }, { errorMessageMode: mode });
  }

  create(Target: Target) {
    return defHttp.post<Target>({
      url: `/${this.type}/${this.storyId}/target`,
      data: Target,
    });
  }

  update(Target: Target) {
    return defHttp.put<Target>({
      url: `/${this.type}/${this.storyId}/target/${Target.id}`,
      data: Target,
    });
  }

  save(Target: Target) {
    if (Target.id) {
      return this.update(Target);
    }
    return this.create(Target);
  }

  remove(id: number) {
    return defHttp.delete({
      url: `/${this.type}/${this.storyId}/target/${id}`,
    });
  }
}