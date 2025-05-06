<script setup lang="ts">
import { useDark } from '@vueuse/core';


const isDark = useDark();
</script>

<template>
  <el-button
    link
    @click="isDark = !isDark"
    size="small"
  >
    <Icon v-if="!isDark" icon="i-ri:sun-fill" size="20" />
    <Icon v-else icon="i-ri:moon-fill" size="20" />
  </el-button>
</template>