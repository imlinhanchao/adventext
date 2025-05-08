<script setup lang="ts">
  import { createBreakpointListen, useBreakpoint } from '@/hooks/event/useBreakpoint';
  import Header from './header/index.vue';
  import Footer from './footer/index.vue';
  import Content from './content/index.vue';
  import Menu from '@/layouts/components/menu/Menu.vue';

  createBreakpointListen();
  const { screenSM } = useBreakpoint();
  watch(() => screenSM.value, addDeviceClass);

  function addDeviceClass(value: boolean) {
    document.body.classList.add(value ? 'isMobile' : 'isDesktop');
    document.body.classList.remove(value ? 'isDesktop' : 'isMobile');
  }

  addDeviceClass(screenSM.value);

  const { currentRoute } = useRouter();
  
</script>
<template>
  <el-container class="h-full">
    <el-aside v-if="!screenSM && currentRoute.name != 'StoryScene'" width="200px" class="border-r border-light-700 dark:border-gray-700 z-3 bg-[--el-bg-color]">
      <Menu />
    </el-aside>
    <el-container id="main-container" class="h-full w-full relative" direction="vertical">
      <Header class="z-2 bg-gradient-to-b from-[var(--el-bg-color)] to-transparent" />
      <Content class="z-0" />
      <Footer />
    </el-container>
  </el-container>
</template>

<style lang="less" scoped>
  .ant-layout {
    min-height: 100vh;
  }
</style>
