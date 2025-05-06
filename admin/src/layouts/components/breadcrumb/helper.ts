import { AppRouteRecordRaw } from '@/router/types';
import type { RouteMeta } from 'vue-router';

export const filterBreadcrumb = (routes: AppRouteRecordRaw[]): AppRouteRecordRaw[] => {
  const res: AppRouteRecordRaw[] = [];

  for (const route of routes) {
    const meta = route?.meta as RouteMeta;
    if (meta.hidden) continue;

    const data: AppRouteRecordRaw =
      route.children?.length === 1 ? { ...route.children[0] } : { ...route };

    if (data.children) {
      data.children = filterBreadcrumb(data.children);
    }
    if (data) res.push(data);
  }
  return res;
};
