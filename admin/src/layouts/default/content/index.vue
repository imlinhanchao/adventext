<template>
  <el-main class="h-full !p-1 overflow-auto">
    <RouterView>
      <template #default="{ Component, route }">
        <transition
          :name="
            getTransitionName({
              route,
              openCache: true,
              enableTransition: true,
              cacheTabs: getCaches,
              def: 'fade-slide',
            })
          "
          mode="out-in"
          appear
        >
          <component :is="Component" :key="route.fullPath" class="h-full" />
        </transition>
      </template>
    </RouterView>
  </el-main>
</template>

<script lang="ts" setup name="Content">
  import router from '@/router';
  import { getTransitionName } from './transition';

  const getCaches = ref(
    router
      .getRoutes()
      .filter((r) => r.name && r.meta.noCache !== false)
      .map((r) => r.name as string),
  );
</script>
