<script lang="ts" setup name="SubMenuItem">
  import BasicMenuItem from './MenuItem.vue';
  import MenuItemContent from './MenuItemContent.vue';
  withDefaults(
    defineProps<{
      icon?: string;
      name: string;
      item: any;
    }>(),
    {},
  );

  function menuHasChildren(menuTreeItem): boolean {
    return (
      Reflect.has(menuTreeItem, 'children') &&
      !!menuTreeItem.children &&
      menuTreeItem.children.filter((m) => !m.meta.hidden).length > 1
    );
  }
</script>
<template>
  <BasicMenuItem v-if="!menuHasChildren(item)" v-bind="$props" />
  <el-sub-menu
    v-if="menuHasChildren(item)"
    :key="`submenu-${item.path}`"
    :index="item.path"
    popupClassName="app-top-menu-popup"
  >
    <template #title>
      <MenuItemContent v-bind="$props" :item="item" />
    </template>

    <template v-for="childrenItem in item.children || []" :key="childrenItem.path">
      <SubMenuItem v-bind="$props" :item="childrenItem" :name="childrenItem.meta.title" />
    </template>
  </el-sub-menu>
</template>
