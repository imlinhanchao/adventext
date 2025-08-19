<template>
  <el-dialog fullscreen v-model="visible" class="z-1000" appendToBody>
    <vue-json-pretty :path="'res'" :deep="3" :showLength="true" :data="data" />
  </el-dialog>
</template>

<script lang="ts" setup>
  import VueJsonPretty from 'vue-json-pretty';
  import 'vue-json-pretty/lib/styles.css';

  const data = ref<any>({});
  const visible = ref(false);

  function open(value: any) {
    data.value = value;
    visible.value = true;
  }

  defineExpose({
    open,
  })

</script>
