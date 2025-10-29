<script setup lang="ts">
  import { setPrimaryColor } from '@/hooks/setting/useThemeSetting';
  import { useDark } from '@vueuse/core';

  const isDark = useDark();
  watch(isDark, (val) => {
    setPrimaryColor(
      getComputedStyle(document.documentElement)
        .getPropertyValue(val ? '--color-dark-primary' : '--color-light-primary')
        .trim(),
    );
  });
</script>

<template>
  <el-button link @click="isDark = !isDark" size="small">
    <Icon v-if="!isDark" icon="i-ri:sun-fill" size="20" />
    <Icon v-else icon="i-ri:moon-fill" size="20" />
  </el-button>
</template>
