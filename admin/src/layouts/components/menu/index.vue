<script setup lang="ts">
  import Menu from '@/layouts/components/menu/Menu.vue';

  const collapsed = ref(false);
  const toggleCollapsed = () => {
    collapsed.value = !collapsed.value;
  };
  function onClose() {
    collapsed.value = false;
  }

  function handleMenuClick() {
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
      class="!w-70"
      :show-close="false"
      :with-header="false"
      v-model="collapsed"
      direction="ltr"
      @close="onClose"
      modal-class="menu-drawer"
      style="--el-drawer-padding-primary: 0;"
    >
      <Menu collapsed @menu-click="handleMenuClick" />
    </el-drawer>
  </section>
</template>