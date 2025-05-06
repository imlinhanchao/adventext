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
  
</script>
<template>
  <el-container class="h-full">
    <el-aside v-if="!screenSM" width="200px" class="border-r border-light-700 dark:border-gray-700">
      <Menu />
    </el-aside>
    <el-container class="h-full w-full" direction="vertical">
      <Header />
      <Content />
      <Footer />
    </el-container>
  </el-container>
</template>

<style lang="less" scoped>
  .ant-layout {
    min-height: 100vh;
  }
</style>
