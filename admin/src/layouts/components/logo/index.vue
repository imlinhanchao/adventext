<script setup lang="ts" name="Logo">
  import { useGlobSetting } from '@/hooks/setting';

  const { title } = useGlobSetting();

  function goHome() {
    location.href = '/';
  }
</script>

<template>
  <div class="flex justify-center h-full py-3 cursor-pointer" @click="goHome">
    <Icon icon="svg-icon:logo" :size="30" />
    <div class="ml-2 truncate md:opacity-100 text-2xl font-bold">
      {{ title }}
    </div>
  </div>
</template>
