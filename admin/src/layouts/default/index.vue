<script setup lang="ts">
  import Header from './header/index.vue';
  import Footer from './footer/index.vue';
  import Content from './content/index.vue';
</script>
<template>
  <el-container class="h-full" direction="vertical">
    <Header />
    <Content />
    <Footer />
  </el-container>
</template>

<style lang="less" scoped>
  .ant-layout {
    min-height: 100vh;
  }
</style>
