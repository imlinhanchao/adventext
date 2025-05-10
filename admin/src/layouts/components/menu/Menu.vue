<script setup lang="ts">
  import { routeModuleList } from '@/router/routes';
  import SubMenuItem from './SubMenuItem.vue';
  import { transformRouteToMenu } from '@/helper/menuHelper';
  import Logo from '@/layouts/components/logo/index.vue';
  import { useUserStore } from '@/store/modules/user';
  
  withDefaults(defineProps<{
    collapsed?: boolean;
  }>(), {
    collapsed: false,
  })

  const { getUserInfo } = useUserStore();
  const menus = computed(() => transformRouteToMenu(routeModuleList));
  function getActiveMenu() {
    menus.value.forEach((menu) => {
      if (menu.children && menu.children.length > 1) {
        menu.children.forEach((child) => {
          if (child.name === route.name && !route.meta.hidden && (getUserInfo.isAdmin || !child.meta.isAdmin)) {
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
  const router = useRouter();
  function handleMenuClick(index) {
    emit('menuClick', index);
    router.push(index)
  }
</script>

<template>
  <el-container>
    <el-header v-if="collapsed">
      <Logo />
    </el-header>
    <el-main class="!p-0">
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
            v-if="!item.meta.hidden && (getUserInfo.isAdmin || !item.meta.isAdmin)"
            :item="item"
            :name="item.meta.title"
            :icon="item.meta.icon"
          />
        </template>
      </el-menu>
    </el-main>
  </el-container>
</template>