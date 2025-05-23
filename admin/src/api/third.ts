import { defHttp } from '@/utils/http';

/**
 * @description: Login interface parameters
 */

/**
 * @description: Get user information return value
 */
export class ThirdParty {
  id?: number;
  /**
   * 名称
   */
  name: string = '';
  /**
   * 图标
   */
  icon: string = '';
  /**
   * 用户名前缀
   */
  prefix: string = '';
  /**
   * 认证地址
   */
  authUrl: string = '';
  /**
   * 认证参数
   */
  authParams: Recordable<string> = {};
  /**
   * 校验地址
   */
  verifyUrl: string = '';
  /**
   * 校验地址请求方式
   */
  verifyMethod: string = 'POST';
  /**
   * 校验参数
   */
  verifyParams: Recordable<string> = {};
  /**
   * 校验公式
   */
  verifyFormula: string = '';
  /**
   * 用户信息地址
   */
  userUrl: string = '';
  /**
   * 用户信息地址请求方式
   */
  userMethod: string = 'GET';
  /**
   * 用户信息参数
   */
  userParams: Recordable<string> = {};
  /**
   * 用户信息返回填充值
   */
  userKey = {
    username: '',
    nickname: '',
  };
}

export function getThirdPartyList() {
  return defHttp.get<ThirdParty[]>({ url: '/third/list' });
}

export function addThirdParty(data: ThirdParty) {
  return defHttp.post({ url: '/third/add', data });
}

export function updateThirdParty(data: ThirdParty) {
  return defHttp.post({ url: '/third/update/' + data.id, data });
}

export function deleteThirdParty(id: number) {
  return defHttp.delete({ url: '/third/delete/' + id });
}