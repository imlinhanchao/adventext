<template>
  <el-menu-item :key="item.path" :index="item.path">
    <MenuItemContent v-bind="$props" :item="item" />
  </el-menu-item>
</template>
<script lang="ts" setup>
  import MenuItemContent from './MenuItemContent.vue';
  withDefaults(
    defineProps<{
      icon?: string;
      name: string;
      item: any;
    }>(),
    {},
  );
</script>
