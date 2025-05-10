import { defHttp } from '@/utils/http';

import { ErrorMessageMode } from '#/axios';

/**
 * @description: Login interface parameters
 */
export interface LoginParams {
  username: string;
  password: string;
}

export interface RoleInfo {
  roleName: string;
  value: string;
}

/**
 * @description: Get user information return value
 */
export interface GetUserInfoModel {
  // 用户id
  id: string | number;
  // 用户名
  username: string;
  // 真实名字
  nickname: string;
  // 邮箱
  email: string;
}

/**
 * @description: user login api
 */
export function login(params: LoginParams, mode: ErrorMessageMode = 'modal') {
  return defHttp.post<string>(
    {
      url: '/login',
      params,
    },
    {
      errorMessageMode: mode,
    },
  );
}

/**
 * @description: getUserInfo
 */
export function getUserInfo() {
  return defHttp.get<GetUserInfoModel>({ url: '/profile' }, { errorMessageMode: 'none' });
}

export function doLogout() {
  return defHttp.post<string>(
    {
      url: '/logout',
    },
    {
      errorMessageMode: 'none',
    },
  );
}

export function generateToken() {
  return defHttp.post<string>(
    {
      url: '/token',
    },
    {
      errorMessageMode: 'none',
    },
  ).catch(() => '');
}

export interface User {
  id: number;
  username: string;
  password: string;
  isAdmin: boolean;
  lastLogin: number;
  attr: any;
}

export function getUserList() {
  return defHttp.get<User[]>({ url: '/user/list' });
}

export function updateUser(user: User) {
  return defHttp.post({ url: '/user/update/' + user.id, data: user });
}

export function deleteUser(id: number) {
  return defHttp.delete({ url: '/user/delete/' + id });
}