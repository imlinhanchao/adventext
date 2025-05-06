<script setup lang="ts" name="Header">
  import BreadCrumb from '@/layouts/components/breadcrumb/index.vue';
  import Logo from '@/layouts/components/logo/index.vue';
  import Menu from '@/layouts/components/menu/index.vue';
  import User from '@/layouts/components/user/index.vue';
  import Dark from '@/layouts/components/dark/index.vue';
  import { useBreakpoint } from '@/hooks/event/useBreakpoint';

  const { screenSM } = useBreakpoint();

</script>

<template>
  <el-header class="!bg-transparent !p-3 !pb-1 relative" height="auto">
    <Menu v-if="screenSM" @menu-click="$router.push($event)" class="z-100" />
    <span :class="{ 'absolute left-0 right-0 flex justify-center z-0': screenSM }"><BreadCrumb /></span>
    <Logo v-if="!screenSM" />
    <span class="flex items-center space-x-2">
      <Dark class="z-1" />
      <User class="z-1" />
    </span>
  </el-header>
</template>
