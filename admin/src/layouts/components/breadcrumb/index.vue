<script lang="ts" setup>
  import { routeModuleList } from '@/router/routes';
  import { AppRouteModule } from '@/router/types';

  const { currentRoute } = useRouter();

  function getBreadCrumbList(breadCrumbList: any[], routeList: AppRouteModule[]) {
    for (const item of routeList) {
      if (item.name === currentRoute.value.name) {
        if (item.path) breadCrumbList.push(item);
        return breadCrumbList;
      } else if (item.children && item.children.length > 0) {
        const childRes = getBreadCrumbList(breadCrumbList, item.children);
        if (childRes) {
          breadCrumbList.unshift(item);
          return childRes;
        }
      }
    }
  }
    
  const breads = ref< AppRouteModule[]>(getBreadCrumbList([], routeModuleList));

  watch(
    () => currentRoute.value,
    () => {
      breads.value = getBreadCrumbList([], routeModuleList);
    },
    { immediate: true }
  );
  
</script>
<template>
  <el-breadcrumb separator="/">
    <el-breadcrumb-item v-for="bread in breads" :key="bread.name" :to="bread.name != currentRoute.name && bread.path || undefined">
      <Icon v-if="bread.meta.icon" :icon="bread.meta.icon" /> {{ bread.meta.title }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>
<style lang="less" scoped>
@prefix-cls: ~'breadcrumb';

.@{prefix-cls} {
  :deep(&__item) {
    display: flex;

    .@{prefix-cls}__inner {
      display: flex;
      align-items: center;
      color: var(--header-text-color);

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }

  :deep(&__item):not(:last-child) {
    .@{prefix-cls}__inner {
      color: var(--header-text-color);

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }

  :deep(&__item):last-child {
    .@{prefix-cls}__inner {
      color: var(--el-text-color-placeholder);

      &:hover {
        color: var(--el-text-color-placeholder);
      }
    }
  }
}
</style>
