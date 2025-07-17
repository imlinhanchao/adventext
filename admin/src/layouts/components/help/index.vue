<script setup lang="ts">
  function help() {
    window.open('https://docs.adventext.fun/', '_blank');
  }
</script>
<template>
  <el-tooltip content="创作帮助" placement="bottom">
    <el-button
      link
      @click="help"
      size="small"
      class="z-1"
    >
      <Icon icon="i-entypo:help" size="20" />
    </el-button>
  </el-tooltip>
</template>