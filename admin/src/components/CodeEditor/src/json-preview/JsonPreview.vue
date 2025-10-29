<template>
  <el-dialog fullscreen v-model="visible" class="z-1000" appendToBody destroyOnClose>
    <ObjectTree v-if="visible" :data="data" />
  </el-dialog>
</template>

<script lang="ts" setup>
  import { ObjectTree } from '@/components/CodeEditor';

  const data = ref<any>({});
  const visible = ref(false);

  function open(value: any) {
    data.value = value;
    visible.value = true;
  }

  defineExpose({
    open,
  });
</script>
