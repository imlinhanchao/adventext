<script setup lang="ts" name="User">
  import { useUserStore } from '@/store/modules/user';

  const userStore = useUserStore();

  function menuClick(key) {
    switch (key) {
      case 'logout':
        userStore.confirmLoginOut();
        break;
    }
  }
</script>
<template>
  <el-dropdown placement="bottom-end" arrow class="mx-3" @command="menuClick">
    <span class="flex items-center cursor-pointer">
      <el-avatar size="small" class="bg-primary">{{ userStore.getUserInfo?.username?.slice(0, 1) }}</el-avatar>
    </span>

    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="logout">退出登录</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>
