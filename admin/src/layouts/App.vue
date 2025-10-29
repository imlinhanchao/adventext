<template>
  <ElConfigProvider :locale="elLocale">
    <RouterView />
  </ElConfigProvider>
</template>

<script lang="ts" setup>
  import { ElConfigProvider } from 'element-plus';
  import { useTitle } from '@/hooks/web/useTitle';
  import elLocale from 'element-plus/es/locale/lang/zh-cn';
  import { setPrimaryColor } from '@/hooks/setting/useThemeSetting';

  const primaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary')
    .trim();
  setPrimaryColor(primaryColor);
  // Listening to page changes and dynamically changing site titles
  useTitle();
</script>
