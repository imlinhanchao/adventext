<script setup lang="ts">
  import { routeModuleList } from '@/router/routes';
  import SubMenuItem from './SubMenuItem.vue';
  import { transformRouteToMenu } from '@/helper/menuHelper';

  const collapsed = ref(false);
  const toggleCollapsed = () => {
    collapsed.value = !collapsed.value;
  };
  function onClose() {
    collapsed.value = false;
  }

  const menus = computed(() => transformRouteToMenu(routeModuleList));
  function getActiveMenu() {
    menus.value.forEach((menu) => {
      if (menu.children && menu.children.length > 1) {
        menu.children.forEach((child) => {
          if (child.name === route.name && !route.meta.hidden) {
            selectedKeys.value = child.path;
            openKeys.value = [menu.path];
          } else if (child.name === route.name) {
            selectedKeys.value = menu.path;
            openKeys.value = [menu.path];
          }
        });
      } else if (menu.name === route.name || menu.children?.[0]?.name === route.name) {
        selectedKeys.value = menu.path;
      }
    });
  }

  const route = useRoute();
  const selectedKeys = ref<string>();
  const openKeys = ref<string[]>([]);

  onMounted(() => {
    getActiveMenu();
  });

  function handleOpenChange(keys: string[]) {
    openKeys.value = keys;
  }

  const emit = defineEmits(['menuClick']);
  function handleMenuClick(index) {
    emit('menuClick', index);
    collapsed.value = false;
  }
</script>

<template>
  <section class="flex items-center">
    <el-button type="primary" link @click="toggleCollapsed" class="!text-inherit hover:text-primary">
      <Icon icon="i-ri:menu-fold-3-fill" v-if="collapsed" size="20" />
      <Icon icon="i-ri:menu-unfold-3-fill" v-else size="20" />
    </el-button>
    <el-drawer
      placement="left"
      class="!w-50"
      :show-close="false"
      :with-header="false"
      v-model="collapsed"
      direction="ltr"
      @close="onClose"
      modal-class="menu-drawer"
      style="--el-drawer-padding-primary: 0;"
    >
      <el-menu
        :defaultActive="selectedKeys"
        :inlineIndent="20"
        @open-change="handleOpenChange"
        @select="handleMenuClick"
        :subMenuOpenDelay="0.2"
        class="!border-none"
      >
        <template v-for="item in menus" :key="item.name">
          <SubMenuItem
            v-if="!item.meta.hidden"
            :item="item"
            :name="item.meta.title"
            :icon="item.meta.icon"
          />
        </template>
      </el-menu>
    </el-drawer>
  </section>
</template>